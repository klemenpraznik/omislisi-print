const pageEdgeElement = document.querySelector(".page.edge");
let printElement = null;

if (pageEdgeElement) {
  // Create a custom "Print" element (div) with the image from the extension's folder as its background.
  const printButton = document.createElement("div");
  printButton.classList.add("print-button"); // Add a CSS class for styling

  // Get the URL of the image from the extension's folder.
  const imageUrl = chrome.runtime.getURL("/icons/printer.png"); // Replace with your image file path

  // Set the background of the custom element to use the image as its background.
  printButton.style.backgroundImage = `url(${imageUrl})`;

  // Add a click event listener to trigger the print functionality.
  printButton.addEventListener("click", async function () {
    try {
      // Read important properties
      let properties = await getData();
      console.log("properties: ", properties);

      // Generate print div
      let printElement = GetPrintElement(properties);

      // Create a new div to hold the printable content
      const printContent = document.createElement("div");
      printContent.innerHTML = printElement;

      // Append the new div to the body
      document.body.appendChild(printContent);

      // Trigger the browser's print dialog
      window.print();

      // Remove the printable content from the body after printing
      document.body.removeChild(printContent);
    } catch (error) {
      console.error("An error occurred: ", error);
    }
  });

  // Append the custom "Print" element to the 'page.edge' element.
  pageEdgeElement.appendChild(printButton);
}

async function getData() {
  try {
    let properties = await ReadProperties();
    // console.log("getData: ", properties);

    return properties;
    // Now you can work with 'properties' here after the promise is resolved.
  } catch (error) {
    console.error("An error occurred: ", error);
  }
}

function ReadProperties() {
  let properties = {};

  properties.region = document.querySelector(
    "li.qr-header-main-value:nth-child(2)"
  ).textContent;
  properties.ventilationType = document.querySelector(
    "li.qr-header-main-value:nth-child(4)"
  ).textContent;
  properties.services = document.querySelector(
    "li.qr-header-main-value:nth-child(6)"
  ).textContent;
  properties.city = document.querySelector(
    ".qr-attributes > dd:nth-child(2)"
  ).textContent;
  properties.surface = document.querySelector(
    ".qr-attributes > dd:nth-child(4)"
  ).textContent;
  properties.priority = document.querySelector(
    ".qr-attributes > dd:nth-child(6)"
  ).textContent;
  properties.message = document.querySelector(
    ".qr-details-message > p:nth-child(1)"
  ).textContent;
  properties.sender = document
    .querySelector(".datablock-meta > li:nth-child(1)")
    .childNodes[0].textContent.trim()
    .replace("Poslal/a ", "");

  let htmlResponse;

  let currentURL = window.location.href;
  let parts = currentURL.split("/").filter(part => part.trim() !== "");;
  let inqueryId = parts[parts.length - 1];
  // console.log("inquery id: ", parts);
  let phoneNumberApiCall = fetch(
    `https://omisli.si/nov-klic/${inqueryId}/?modal=1`,
    {
      method: "GET",
      headers: {
        Host: "omisli.si",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/118.0",
        Accept: "application/json, text/javascript, */*; q=0.01",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate, br",
        "X-Requested-With": "XMLHttpRequest",
        Connection: "keep-alive",
        Referer: `https://omisli.si/povprasevanja/povprasevanje/${inqueryId}/`,
        
      },
    }
  )
    .then((response) => {
      if (response.ok) {
        return response.json(); // Assuming the response is in JSON format
      } else {
        throw new Error("Request failed with status: " + response.status);
      }
    })
    .then((data) => {
      // Handle the response data here
      // console.log("fetch then data: ", data.actions[0].html);
      htmlResponse = data.actions[0].html;
    })
    .catch((error) => {
      // Handle errors here
      console.error(error);
    });

  const abbrElement = document.querySelector(
    ".datablock-meta > li:nth-child(1) abbr"
  );
  if (abbrElement) {
    // let date = new Date(abbrElement.getAttribute("title"));
    let date = parseCustomDate(abbrElement.getAttribute("title"));
    
    // console.log("date: ", abbrElement.getAttribute("title"))
    // console.log("date: ", date)
    
    properties.date = date.toLocaleDateString("sk-SK");
    properties.time = date.toLocaleTimeString("sk-SK", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  let currentDate = new Date();
  properties.currentDate = currentDate.toLocaleDateString("sk-SK");
  properties.currentTime = currentDate.toLocaleTimeString("sk-SK", {
    hour: "2-digit",
    minute: "2-digit",
  });



  // Wait for both the phone number promise and other data to be resolved
  return Promise.all([phoneNumberApiCall]).then((results) => {
    // console.log("properties.phoneNumberHtml: ", htmlResponse);
    // Create a temporary div element to parse the HTML
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = htmlResponse;
    // Use querySelector to select the phone number element
    const phoneNumberElement = tempDiv.querySelector(".phone-number");
    // Extract the phone number text
    const phoneNumberText = phoneNumberElement.querySelector("a").textContent;
    // console.log("phone number: ", phoneNumberText);
    properties.phoneNumber = phoneNumberText;
    // console.log("phone number property: ", properties.phoneNumber);
    return properties;
  });
  return properties;
}

function GetPrintElement(properties) {
  return `<div id="print-element">
  <h1>Povpraševanje za prezračevanje (<span class="orange-text">omisli.si</span>)</h1>
  <div class="ventilation-type"><span class="property-name">Sistem prezračevanja: </span><span class="property-value">${properties.ventilationType}</span></div>
  <div class="services"><span class="property-name">Storitve: </span><span class="property-value">${properties.services}</span></div>
  <div class="surface"><span class="property-name">Kvadratura: </span><span class="property-value">${properties.surface}</span></div>
  <div class="priority"><span class="property-name">Čas odločitve: </span><span class="property-value">${properties.priority}</span></div>
  <div class="date"><span class="property-name">Datum povpraševanja: </span><span class="property-value">${properties.date} ${properties.time}</span></div>
  <div class="current-date"><span class="property-name">Datum tiskanja: </span><span class="property-value">${properties.currentDate} ${properties.currentTime}</span></div>
  <div class="sender"><span class="property-name">Stranka: </span><span class="property-value">${properties.sender}</span></div>
  <div class="city"><span class="property-name">Mesto: </span><span class="property-value">${properties.city}</span></div>
  <div class="phone"><span class="property-name">Tel. št.: </span><span class="property-value">${properties.phoneNumber}</span></div>
  <h2>Sporočilo</h2>
  <div class="message">${properties.message}</div>
</div>`;
}

function parseCustomDate(dateString) {
  // Define month mappings for your language
  const months = {
    "Jan": 0,
    "Feb": 1,
    "Mar": 2,
    "Apr": 3,
    "Maj": 4,
    "Jun": 5,
    "Jul": 6,
    "Aug": 7,
    "Sep": 8,
    "Okt": 9,
    "Nov": 10,
    "Dec": 11,
  };

  // Split the date string into parts
  const parts = dateString.split(' ');

  if (parts.length < 4) {
    return null; // Invalid date format
  }

  // Extract date components
  const day = parseInt(parts[1], 10);
  const month = months[parts[2]];
  const year = parseInt(parts[3], 10);

  if (isNaN(day) || isNaN(month) || isNaN(year)) {
    return null; // Invalid date format
  }

  // Extract time components (if present)
  let hours = 0;
  let minutes = 0;

  if (parts.length >= 5) {
    const time = parts[4].split(':');
    if (time.length === 2) {
      hours = parseInt(time[0], 10);
      minutes = parseInt(time[1], 10);
    }
  }

  if (isNaN(hours) || isNaN(minutes)) {
    return null; // Invalid time format
  }

  // Create a JavaScript Date object
  const jsDate = new Date(year, month, day, hours, minutes);
  return jsDate;
}
