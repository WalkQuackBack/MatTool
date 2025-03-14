const searchBtn = document.getElementById("search");
async function fetchJsonData() {
  try {
    const response = await fetch("./assets/data/materials.json");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching JSON:", error);
  }
}

async function searchTextures() {
  searchBtn.setAttribute("disabled", "true");
  searchBtn.classList.add("loading");

  const jsonData = await fetchJsonData();
  if (!jsonData) {
    console.error("No JSON data available");
    return;
  }
  const selectedTextures = Array.from(
    document.querySelectorAll('input[name="texture"]:checked')
  ).map((el) => el.value);
  const isRestricted = document.getElementById("restrictedSearch").checked;
  const skinCountEnabled = document.getElementById("skinCountToggle").checked;
  const selectedSkinCount = parseInt(
    document.getElementById("skinCount").value
  );

  let results = [];

  for (const key in jsonData) {
    if (jsonData.hasOwnProperty(key)) {
      let materials = jsonData[key].Materials;

      let match = materials.filter((material) => {
        let materialTextures = Object.keys(material)
          .filter((k) => k !== "Possible Skin Counts")
          .map((k) => material[k])
          .flat();
        let skinCountMatch =
          !skinCountEnabled ||
          material["Possible Skin Counts"].includes(selectedSkinCount);

        // Check if all selected textures are in the material textures
        const allSelectedPresent = selectedTextures.every((st) =>
          materialTextures.some((mt) => mt.includes(st))
        );

        // Non-Restricted Search: The material must contain all selected textures but can also have others.
        if (!isRestricted) {
          return skinCountMatch && allSelectedPresent;
        }

        // Restricted Search: The material must contain only and all of the selected textures.
        // Check if material textures don't have extra textures not included in selected textures
        const noExtraTextures = materialTextures.every((mt) =>
          selectedTextures.some((st) => mt.includes(st))
        );

        // Both conditions must be met for a match in Restricted Search
        return skinCountMatch && allSelectedPresent && noExtraTextures;
      });

      if (match.length > 0) {
        results.push({ key, match });
      }
    }
  }

  displayResults(results);
}

const delay = (ms) => new Promise((res) => setTimeout(res, ms));
async function displayResults(results) {
  const resultsDiv = document.getElementById("searchResults");
  resultsDiv.innerHTML = "";

  if (results.length === 0) {
    resultsDiv.innerHTML = "<h1>Can't find any materials.</h1>";
    searchBtn.removeAttribute("disabled");
    searchBtn.classList.remove("loading");
    return;
  }

  let i = 0;
  await results.forEach(async (item) => {
    await item.match.forEach(async (material) => {
      const materialName = Object.keys(material)[0]; // e.g., "Mt_Body"
      const textures = material[materialName]; // array of texture names
      i += 1;

      // Create a button for each material that acts as the dropdown title
      const materialButton = document.createElement("li");
      // materialButton.textContent = `${materialName}\n${item.key}`;
      materialButton.classList.add("material-button");
      materialButton.classList.add("primary");
      materialButton.setAttribute("role", "button");
      materialButton.setAttribute("tabindex", i);

      const header = document.createElement("span");
      header.textContent = materialName;

      const lower = document.createElement("span");
      lower.textContent = item.key;

      const copyBtn = document.createElement("button");
      copyBtn.classList.add("copy-btn");

      i += 1;
      copyBtn.setAttribute("tabindex", i);

      materialButton.append(header, lower, copyBtn);

      // Populate the texture information
      const textureList = document.createElement("ul");
      textureList.classList.add("material-info");
      textures.forEach((texture) => {
        i += 1;
        const li = document.createElement("li");
        li.classList.add("material-button");

        const maintext = document.createElement("span");
        maintext.textContent = texture;

        const supportingtext = document.createElement("span");
        supportingtext.textContent = getTextureType(texture);

        const subCopyBtn = document.createElement("button");
        subCopyBtn.classList.add("copy-btn");
        subCopyBtn.setAttribute("tabindex", i);

        subCopyBtn.addEventListener("click", function (e) {
          // TODO: fix hack
          // materialButton.classList.toggle("active");
          // textureList.classList.toggle("active");
          console.log("copy");
          navigator.clipboard
            .writeText(texture)
            .then(() => {
              subCopyBtn.classList.add("yippee");
              window.setTimeout(
                () => subCopyBtn.classList.remove("yippee"),
                500
              );
            })
            .catch((err) => {
              // console.error("Failed to copy: ", err);
              subCopyBtn.classList.add("uhoh");
            });
        });

        // li.textContent = `${texture} (${getTextureType(texture)})`;
        li.append(maintext, supportingtext, subCopyBtn);
        textureList.append(li);
      });

      // Event listener to toggle the display of the material info
      materialButton.addEventListener("click", function () {
        materialButton.classList.toggle("active");
        textureList.classList.toggle("active");
      });

      copyBtn.addEventListener("click", function (e) {
        // TODO: fix hack
        materialButton.classList.toggle("active");
        textureList.classList.toggle("active");
        navigator.clipboard
          .writeText(item.key)
          .then(() => {
            copyBtn.classList.add("yippee");
            window.setTimeout(() => copyBtn.classList.remove("yippee"), 500);
          })
          .catch((err) => {
            // console.error("Failed to copy: ", err);
            copyBtn.classList.add("uhoh");
          });
      });

      // Append the button and info div to the results div
      resultsDiv.append(materialButton, textureList);

      if (i % 50 == 0) {
        await delay(1000);
      }
    });
  });
  searchBtn.classList.remove("loading");
  searchBtn.removeAttribute("disabled");
}

function expandAll() {
  const items = document.querySelectorAll(
    ".material-button.primary, .material-info"
  );
  items.forEach(function (element) {
    element.classList.add("active");
  });
}

function collapseAll() {
  const items = document.querySelectorAll(
    ".material-button.primary, .material-info"
  );
  items.forEach(function (element) {
    element.classList.remove("active");
  });
}

function getTextureType(textureName) {
  if (textureName.includes("Alb")) return "Albedo Texture (Color)";
  if (textureName.includes("Nrm")) return "Normal Map";
  if (textureName.includes("Spm")) return "Specular Map";
  if (textureName.includes("Emm")) return "Emission Texture";
  if (textureName.includes("Emc")) return "Emission Color";
  if (textureName.includes("EmmMsk")) return "Emission Mask";
  if (textureName.includes("AO")) return "Ambient Occlusion";
  if (textureName.includes("Gn0")) return "Graphic #0";
  if (textureName.includes("Gn1")) return "Graphic #1";
  if (textureName.includes("Gn2")) return "Graphic #2";
  if (textureName.includes("Gn3")) return "Graphic #3";
  if (textureName.includes("Gn4")) return "Graphic #4";
  if (textureName.includes("Gn5")) return "Graphic #5";
  // Add more conditions for other texture types
  return "Unknown Type";
}

function getTextureTypeClass(textureName) {
  // Returns a class name based on the texture type
  if (textureName.includes("Alb")) return "Alb-color";
  if (textureName.includes("Nrm")) return "Nrm-color";
  if (textureName.includes("Spm")) return "Spm-color";
  if (textureName.includes("Emm")) return "Emm-color";
  if (textureName.includes("Emc")) return "Emc-color";
  if (textureName.includes("EmmMsk")) return "EmmMsk-color";
  // Add more conditions for other texture types
  return "unknown-type";
}

function changeSkinCount(change) {
  const skinCountInput = document.getElementById("skinCount");
  let currentCount = parseInt(skinCountInput.value);
  currentCount = Math.min(Math.max(currentCount + change, 0), 8);
  skinCountInput.value = currentCount;
}

document.addEventListener("DOMContentLoaded", (event) => {
  // Attach change event listener to the skin count toggle
  document
    .getElementById("skinCountToggle")
    .addEventListener("change", function () {
      // Get the skin count select element
      const skinCountSelect = document.getElementById("skinCount");

      // Check if the toggle is checked
      if (this.checked) {
        // Show the skin count selector
        skinCountSelect.removeAttribute("disabled");
      } else {
        // Hide the skin count selector
        skinCountSelect.setAttribute("disabled", "true");
      }
    });
  document.addEventListener("keydown", function (event) {
    if (event.key === "Enter" || event.key == " ") {
      event.preventDefault();
      document.activeElement.click();
    }
  });
});
