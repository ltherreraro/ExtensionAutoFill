document.addEventListener("DOMContentLoaded", () => {
    const profileSelect = document.getElementById("profileSelect");
    const tableBody = document.getElementById("fieldsTable").querySelector("tbody");
    const filterInput = document.getElementById("filterInput");
    const saveAllButton = document.getElementById("save-all");
    const variablesTextarea = document.getElementById("variables");
    let formFields = []; // Declaración de formFields en un alcance más amplio
    let variables = {}; // Declaración de variables en un alcance más amplio

    // Cargar perfiles desde el almacenamiento local
    function loadProfiles() {
        chrome.storage.local.get(null, (items) => {
            const profiles = Object.keys(items).filter(key => key !== 'variables');
            profileSelect.innerHTML = ""; // Limpiar el selector de perfiles
            profiles.forEach(profile => {
                const option = document.createElement("option");
                option.value = profile;
                option.textContent = profile;
                profileSelect.appendChild(option);
            });
            if (profiles.length > 0) {
                loadProfileData(profiles[0]); // Cargar datos del primer perfil
            } else {
                tableBody.innerHTML = ""; // Limpiar la tabla si no hay perfiles
            }
        });
    }

    // Función para cargar y mostrar los datos del perfil seleccionado
    function loadProfileData(profileName) {
        chrome.storage.local.get(profileName, (result) => {
            formFields = result[profileName] || [];
            tableBody.innerHTML = ""; // Limpiar la tabla
            formFields.forEach((field, index) => {
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${field.type}</td>
                    <td>${field.name}</td>
                    <td contenteditable="true">${field.value}</td>
                `;
                tableBody.appendChild(row);
            });
        });
    }

    // Manejar el cambio de selección de perfil
    profileSelect.addEventListener("change", () => {
        const selectedProfile = profileSelect.value;
        loadProfileData(selectedProfile);
    });

    // Filtrar la tabla según el texto ingresado
    filterInput.addEventListener("input", () => {
        const filterValue = filterInput.value.toLowerCase();
        const rows = tableBody.querySelectorAll("tr");

        rows.forEach(row => {
            const nameCell = row.cells[1];
            const name = nameCell.textContent.toLowerCase();
            if (name.includes(filterValue)) {
                row.style.display = "";
            } else {
                row.style.display = "none";
            }
        });
    });

    // Guardar todos los campos y las variables
    if (saveAllButton) {
        saveAllButton.addEventListener("click", () => {
            // Guardar las variables ingresadas
            try {
                variables = JSON.parse(variablesTextarea.value);
                chrome.storage.local.set({ variables }, () => {
                    console.log("Variables guardadas.");
                });
            } catch (e) {
                alert("Error al guardar las variables. Asegúrese de que el formato JSON sea correcto.");
                return;
            }

            // Guardar todos los campos modificados
            const rows = tableBody.querySelectorAll("tr");
            const updatedFields = [];

            rows.forEach((row, index) => {
                let value = row.cells[2].textContent;
                updatedFields.push({...formFields[index], value });
            });

            const selectedProfile = profileSelect.value;
            chrome.storage.local.set({
                [selectedProfile]: updatedFields
            }, () => {
                alert(`Todos los campos y variables han sido guardados para el perfil: ${selectedProfile}.`);
            });
        });
    }

    // Cargar variables al cargar la página
    chrome.storage.local.get('variables', (result) => {
        variables = result.variables || {};
        variablesTextarea.value = JSON.stringify(variables, null, 2);
    });

    // Cargar perfiles al cargar la página
    loadProfiles();

    // Escuchar mensajes para actualizar la interfaz de usuario
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === "profileDeleted") {
            loadProfiles();
        }
    });
});