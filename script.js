document.addEventListener("DOMContentLoaded", () => {
  const apiKey = "d8628f02f360c475aebd63424adda329";
  const defaultCity = "New York";

  const cityElement = document.getElementById("city");
  const temperatureElement = document.getElementById("temperature");
  const descriptionElement = document.getElementById("description");
  const weatherIcon = document.getElementById("weather-icon");
  const settingsButton = document.getElementById("settings-button");
  const settingsModal = document.getElementById("settings-modal");
  const closeModalButton = document.getElementById("close-settings");
  const saveCityButton = document.getElementById("save-city");
  const citySearchInput = document.getElementById("city-search");
  const unitToggle = document.getElementById("unit-toggle");

// 🌍 Shared Weather Icon Map
const iconMap = {
  clear: "sun.svg",
  clouds: "cloud.svg", // forecast default (no cloud % data here)
  rain: "rain.svg",
  drizzle: "rain.svg",
  snow: "snow.svg",
  thunderstorm: "storm.svg",
  mist: "fog.svg",
  smoke: "fog.svg",
  haze: "fog.svg",
  dust: "fog.svg",
  fog: "fog.svg",
  sand: "fog.svg",
  ash: "fog.svg",
  squall: "storm.svg",
  tornado: "storm.svg",
};

  // 🌤 Fetch Current Weather
  async function fetchWeather(city, unit = "imperial") {
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=${unit}`
      );
      if (!response.ok) throw new Error("City not found");
      const data = await response.json();

      updateWeatherUI(data, unit);

      // 🌧 Rain, Humidity, Wind
      document.getElementById("rain").textContent =
        data.rain && data.rain["1h"] ? `${data.rain["1h"]}%` : "0%";
      document.getElementById("humidity").textContent = `${data.main.humidity}%`;
      document.getElementById("wind").textContent = `${Math.round(
        data.wind.speed
      )} ${unit === "metric" ? "km/h" : "mph"}`;

      // 📅 Fetch forecast after weather
      fetchForecast(city, unit);
    } catch (error) {
      alert("City not found. Please try again.");
    }
  }

  // 📅 Fetch 5-Day Forecast
  async function fetchForecast(city, unit = "imperial") {
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=${unit}`
      );
      if (!response.ok) throw new Error("Forecast not available");
      const data = await response.json();
      updateForecastUI(data, unit);
    } catch (error) {
      console.error("❌ Forecast error:", error);
    }
  }

  // 🌤 Update Current Weather UI
  function updateWeatherUI(data, unit) {
    const unitSymbol = unit === "metric" ? "°C" : "°F";
    cityElement.textContent = data.name;
    temperatureElement.textContent = Math.round(data.main.temp) + unitSymbol;
    descriptionElement.textContent = data.weather[0].description;

    const main = data.weather[0].main.toLowerCase();
    const cloudCover = data.clouds.all;

   let iconFile = iconMap[main] || "sun.svg";

// Special rule: handle partly cloudy for current weather
if (main === "clouds") {
  iconFile = cloudCover <= 50 ? "suncloud.svg" : "cloud.svg";
}

weatherIcon.src = `icons/${iconFile}`;
weatherIcon.alt = main;
    weatherIcon.src = `icons/${iconFile}`;
    weatherIcon.alt = main;
  }

  // 📅 Update Forecast UI
  function updateForecastUI(data, unit) {
    const forecastContainer = document.getElementById("weekly-forecast");
    forecastContainer.innerHTML = ""; // clear old forecast

    // Group forecasts by day
    const dailyData = {};

    data.list.forEach((entry) => {
      const date = new Date(entry.dt * 1000);
     // Use YYYY-MM-DD as the unique key (avoids repeats like multiple "Fri")
const dayKey = date.toISOString().split("T")[0]; 
const weekday = date.toLocaleDateString("en-US", { weekday: "short" });

if (!dailyData[dayKey]) {
  dailyData[dayKey] = {
    temps: [],
    icons: [],
    label: weekday, // store weekday for display
  };
}
dailyData[dayKey].temps.push(entry.main.temp);
dailyData[dayKey].icons.push(entry.weather[0].description.toLowerCase());
    });

    // Only take first 5 days
    const days = Object.keys(dailyData).slice(0, 5);

    days.forEach((day) => {
      const temps = dailyData[day].temps;
      const min = Math.round(Math.min(...temps));
      const max = Math.round(Math.max(...temps));

      // Pick most frequent icon of the day
      const icons = dailyData[day].icons;
      const iconCount = {};
      icons.forEach((icon) => {
        iconCount[icon] = (iconCount[icon] || 0) + 1;
      });
      const mainIcon = Object.keys(iconCount).reduce((a, b) =>
  iconCount[a] > iconCount[b] ? a : b
);

// Smarter match on description
let iconFile = "sun.svg";
if (mainIcon.includes("clear")) {
  iconFile = "sun.svg";
} else if (mainIcon.includes("few clouds") || mainIcon.includes("scattered")) {
  iconFile = "suncloud.svg";
} else if (mainIcon.includes("cloud")) {
  iconFile = "cloud.svg";
} else if (mainIcon.includes("rain") || mainIcon.includes("drizzle")) {
  iconFile = "rain.svg";
} else if (mainIcon.includes("thunder")) {
  iconFile = "storm.svg";
} else if (mainIcon.includes("snow")) {
  iconFile = "snow.svg";
} else if (
  mainIcon.includes("mist") ||
  mainIcon.includes("fog") ||
  mainIcon.includes("haze") ||
  mainIcon.includes("smoke") ||
  mainIcon.includes("dust")
) {
  iconFile = "fog.svg";
}

      // Build forecast card
      const card = document.createElement("div");
      card.className = "forecast-day";
      card.innerHTML = `
        <div class="day">${dailyData[day].label}</div>
        <img src="icons/${iconFile}" alt="${mainIcon}" />
        <div class="temps">
  <div class="temp-high">${max}°</div>
  <div class="temp-low">${min}°</div>
</div>
      `;
      forecastContainer.appendChild(card);
    });
  }

  // ⚙️ Modal Event Listeners
  if (settingsButton && settingsModal && closeModalButton) {
    settingsButton.addEventListener("click", () => {
      settingsModal.classList.remove("hidden");
      settingsModal.classList.add("visible");
      citySearchInput.value = "";
      citySearchInput.focus();
    });

    closeModalButton.addEventListener("click", () => {
      settingsModal.classList.remove("visible");
      settingsModal.classList.add("hidden");
    });

    saveCityButton.addEventListener("click", () => {
      const city = citySearchInput.value.trim();
      const unit = unitToggle.value;
      if (city) {
        fetchWeather(city, unit);
        fetchForecast(city, unit);
        settingsModal.classList.remove("visible");
        settingsModal.classList.add("hidden");
      }
    });

    citySearchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        saveCityButton.click();
      }
    });
  } else {
    console.error("❌ Modal elements not found in DOM.");
  }

  // Fetch default city's weather + forecast on load
  fetchWeather(defaultCity);
  fetchForecast(defaultCity);
});