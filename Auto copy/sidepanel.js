document.addEventListener("DOMContentLoaded", () => {
    const saveButton = document.getElementById("save");
    const executeButton = document.getElementById("execute");

    let profiles = []; // Lista inicial de perfiles
    let selectedProfile = null;

    // Cargar perfiles desde el almacenamiento local
    function loadProfiles() {
        chrome.storage.local.get(null, (items) => {
            profiles = Object.keys(items).filter(key => key !== 'variables');
            if (!profiles.includes('New')) {
                profiles.unshift('New'); // Asegurarse de que "New" siempre esté presente
            }
            if (profiles.length > 1) {
                selectedProfile = profiles[1]; // Seleccionar el primer perfil real
                checkStoredData(); // Verificar si hay datos guardados para el perfil seleccionado
            }
            updateProfileList(); // Actualizar la lista de perfiles en el DOM
        });
    }

    // Verificar si hay datos guardados al cargar la página
    function checkStoredData() {
        if (selectedProfile) {
            chrome.storage.local.get(selectedProfile, (result) => {
                const formFields = result[selectedProfile];
                if (formFields && formFields.length > 0) {
                    executeButton.disabled = false;
                    alert(`Perfil "${selectedProfile}" seleccionado con datos: ${JSON.stringify(formFields)}`);
                } else {
                    executeButton.disabled = true;
                    alert(`Perfil "${selectedProfile}" seleccionado pero no tiene datos guardados.`);
                }
            });
        } else {
            executeButton.disabled = true;
        }
    }

    saveButton.addEventListener("click", async function() {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab && tab.url && (tab.url.startsWith('http://') || tab.url.startsWith('https://'))) {
            console.log("Inyectando script para capturar datos del formulario.");
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: captureFormFields,
            }, (results) => {
                const formData = results[0].result;
                console.log("Guardando datos del formulario:", formData);
                // Guardar los datos en el almacenamiento local
                chrome.storage.local.set({
                    [selectedProfile]: formData
                }, () => {
                    console.log(`Datos guardados para el perfil: ${selectedProfile}`);
                    alert(`Datos guardados para el perfil: ${selectedProfile}`);
                    // Habilitar el botón "Ejecutar" si hay datos guardados
                    executeButton.disabled = false;
                });
            });
        } else {
            alert("No se puede ejecutar el script en esta URL.");
        }
    });

    executeButton.addEventListener("click", async function() {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab && tab.url && (tab.url.startsWith('http://') || tab.url.startsWith('https://'))) {
            console.log(`Ejecutando script para el perfil: ${selectedProfile}`);
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: fillFormFromProfile,
                args: [selectedProfile] // Pasar el nombre del perfil como argumento
            });
        } else {
            alert("No se puede ejecutar el script en esta URL.");
        }
    });

    // Función para rellenar el formulario con un perfil
    function fillFormFromProfile(profileName) {
        chrome.storage.local.get(['variables', profileName], (result) => {
            console.log(`Datos obtenidos del almacenamiento local para el perfil ${profileName}:`, result);
            const variables = result.variables || {};
            const formFields = result[profileName];
            if (formFields) {
                formFields.forEach(field => {
                    let value = field.value.replace(/\{@(\w+)\}/g, (match, p1) => variables[p1] || match);

                    let input;

                    if (field.name || field.id) {
                        // Seleccionar el elemento específico basado en su nombre y opcionalmente su id
                        let selector;
                        if (field.id) {
                            selector = `[id="${field.id}"]`;
                            console.log("tiene id", { selector });
                        } else {
                            selector = `[name="${field.name}"]`;
                            console.log("tiene name", { selector });
                        }

                        input = document.querySelector(selector);
                        if (input) {
                            console.log(`Elemento encontrado por name:`, input);
                        } else {
                            console.error(`No se encontró ningún elemento con el selector: ${selector}`);
                        }

                        // console.log(`El field.name es: ${field.name}, el input es: ${input.name}.`);
                    } else if (field.labelText) {
                        // Seleccionar el checkbox basado en el texto del label
                        const label = Array.from(document.querySelectorAll('label')).find(label => label.textContent.trim() === field.labelText);
                        if (label) {
                            input = label.querySelector('input[type="checkbox"], input[type="radio"]');
                            console.log(`Elemento encontrado mediante labelText:`, label, input);
                        }
                    } else if (field.spanText) {
                        // Seleccionar el checkbox basado en el texto del span
                        const span = Array.from(document.querySelectorAll('span')).find(span => span.textContent.trim() === field.spanText);
                        if (span) {
                            input = span.closest('label').querySelector('input[type="checkbox"], input[type="radio"]');
                            console.log(`Elemento encontrado mediante spanText:`, span, input);
                        }
                    }
                    if (input && !input.disabled) {

                        if (input.type === 'checkbox' || input.type === 'radio') {
                            if (field.value === 'true') {
                                // console.log(`El field.name es: ${field.name}, el field.id es: ${field.id}, y el field.value es: ${field.value}`);
                                input.click();
                                input.dispatchEvent(new Event('change', { bubbles: true }));
                            } else {
                                console.log(`El field.name es: ${field.name}, el field.id es: ${field.id}, y el field.value es: ${field.value}`);

                            }
                        } else {
                            input.value = value;
                            // console.log(`El field.name es: ${field.name}, el field.id es: ${field.id}, y el field.value es: ${field.value}`);
                            // console.log(`value es: ${value}`);
                            input.dispatchEvent(new Event('input', { bubbles: true }));
                            input.dispatchEvent(new Event('change', { bubbles: true }));
                            input.dispatchEvent(new Event('blur', { bubbles: true }));
                        }
                    }
                });
                alert(`Formulario rellenado para el perfil: ${profileName}`);
            } else {
                alert(`No se encontraron datos para el perfil: ${profileName}`);
            }
        });
    }

    // function fillFormFromProfile(profileName) {
    //     chrome.storage.local.get(['variables', profileName], (result) => {
    //         console.log(`Datos obtenidos del almacenamiento local para el perfil ${profileName}:`, result);
    //         const variables = result.variables || {};
    //         const formFields = result[profileName];
    //         if (formFields) {
    //             formFields.forEach(field => {
    //                 let value = field.value.replace(/\{@(\w+)\}/g, (match, p1) => variables[p1] || match);

    //                 let input;

    //                 if (field.name || field.id) {
    //                     // Seleccionar el elemento específico basado en su nombre y opcionalmente su id
    //                     const selector = field.id ? `[name="${field.name}"][id="${field.id}"]` : `[name="${field.name}"]`;

    //                     input = document.querySelector(selector);
    //                     if (input) {
    //                         console.log(`Elemento encontrado por name:`, input);
    //                     } else {
    //                         console.error(`No se encontró ningún elemento con el selector: ${selector}`);
    //                     }

    //                     // console.log(`El field.name es: ${field.name}, el input es: ${input.name}.`);
    //                 } else if (field.labelText) {
    //                     // Seleccionar el checkbox basado en el texto del label
    //                     const label = Array.from(document.querySelectorAll('label')).find(label => label.textContent.trim() === field.labelText);
    //                     if (label) {
    //                         input = label.querySelector('input[type="checkbox"], input[type="radio"]');
    //                         console.log(`Elemento encontrado mediante labelText:`, label, input);
    //                     }
    //                 } else if (field.spanText) {
    //                     // Seleccionar el checkbox basado en el texto del span
    //                     const span = Array.from(document.querySelectorAll('span')).find(span => span.textContent.trim() === field.spanText);
    //                     if (span) {
    //                         input = span.closest('label').querySelector('input[type="checkbox"], input[type="radio"]');
    //                         console.log(`Elemento encontrado mediante spanText:`, span, input);
    //                     }
    //                 }
    //                 if (input && !input.disabled) {

    //                     if (input.type === 'checkbox' || input.type === 'radio') {
    //                         if (field.value === 'true') {
    //                             // console.log(`El field.name es: ${field.name}, el field.id es: ${field.id}, y el field.value es: ${field.value}`);
    //                             input.click();
    //                             input.dispatchEvent(new Event('change', { bubbles: true }));
    //                         } else {
    //                             console.log(`El field.name es: ${field.name}, el field.id es: ${field.id}, y el field.value es: ${field.value}`);

    //                         }
    //                     } else {
    //                         input.value = value;
    //                         // console.log(`El field.name es: ${field.name}, el field.id es: ${field.id}, y el field.value es: ${field.value}`);
    //                         // console.log(`value es: ${value}`);
    //                         input.dispatchEvent(new Event('input', { bubbles: true }));
    //                         input.dispatchEvent(new Event('change', { bubbles: true }));
    //                         input.dispatchEvent(new Event('blur', { bubbles: true }));
    //                     }
    //                 }
    //             });
    //             alert(`Formulario rellenado para el perfil: ${profileName}`);
    //         } else {
    //             alert(`No se encontraron datos para el perfil: ${profileName}`);
    //         }
    //     });
    // }



    document.getElementById("options").addEventListener("click", () => {
        console.log("Abrir página de opciones");
        chrome.runtime.openOptionsPage();
    });

    const searchContainer = document.querySelector('.search-input-box');
    const inputSearch = searchContainer.querySelector('input');
    const boxSuggestions = document.querySelector('.container-suggestions');

    inputSearch.onkeyup = e => {
        let userData = e.target.value;
        let emptyArray = [];

        if (userData) {
            emptyArray = profiles.filter(data => {
                return data.toLocaleLowerCase().startsWith(userData.toLocaleLowerCase());
            });

            emptyArray = emptyArray.map(data => {
                return `<li>${data}</li>`;
            });
            searchContainer.classList.add('active');
            showSuggestions(emptyArray);

            let allList = boxSuggestions.querySelectorAll('li');

            allList.forEach(li => {
                li.addEventListener('click', () => select(li));
            });
        } else {
            searchContainer.classList.remove('active');
        }
    };

    function select(element) {
        let selectUserData = element.textContent;
        inputSearch.value = selectUserData;
        searchContainer.classList.remove('active');
        selectProfile(selectUserData); // Seleccionar el perfil correspondiente
    }

    const showSuggestions = list => {
        let listData;

        if (!list.length) {
            userValue = inputSearch.value;
            listData = `<li>${userValue}</li>`;
        } else {
            listData = list.join(' ');
        }
        boxSuggestions.innerHTML = listData;
    };

    // Función para agregar un nuevo perfil
    function addNewProfile() {
        let profileName = prompt("Ingrese el nombre del nuevo perfil:");

        if (profileName) {
            profiles.push(profileName); // Agregar el nuevo perfil a la lista de perfiles
            updateProfileList(); // Actualizar la lista de perfiles en el DOM
            alert(`Perfil "${profileName}" agregado.`);
            selectProfile(profileName); // Seleccionar el nuevo perfil automáticamente
        }
    }

    // Función para seleccionar un perfil
    function selectProfile(profileName) {
        if (profileName === 'New') {
            addNewProfile();
        } else {
            selectedProfile = profileName;
            console.log(`Perfil seleccionado: ${selectedProfile}`);
            checkStoredData(); // Verificar si hay datos guardados para el perfil seleccionado
        }
    }

    // Función para actualizar la lista de perfiles en el DOM
    function updateProfileList() {
        const profileList = document.querySelector('.dropdown__sub');
        profileList.innerHTML = ''; // Limpiar la lista de perfiles

        profiles.forEach(profile => {
            let profileItem = document.createElement('li');
            profileItem.classList.add('dropdown__li');
            profileItem.innerHTML = `<a href="#" class="dropdown__anchor">${profile}</a>`;
            profileList.appendChild(profileItem);

            // Agregar evento de clic al perfil
            profileItem.querySelector('a').addEventListener('click', function(event) {
                event.preventDefault();
                selectProfile(profile);
            });
        });
    }

    // Inicializar la lista de perfiles en el DOM
    loadProfiles();

    // Guardar datos del formulario en el perfil seleccionado
    document.getElementById('save').addEventListener('click', async function() {
        if (selectedProfile) {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab && tab.url && (tab.url.startsWith('http://') || tab.url.startsWith('https://'))) {
                console.log("Inyectando script para capturar datos del formulario.");
                chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    func: captureFormFields,
                }, (results) => {
                    const formData = results[0].result;
                    console.log("Guardando datos del formulario:", formData);
                    // Guardar los datos en el almacenamiento local
                    chrome.storage.local.set({
                        [selectedProfile]: formData
                    }, () => {
                        console.log(`Datos guardados para el perfil: ${selectedProfile}`);
                        alert(`Datos guardados para el perfil: ${selectedProfile}`);
                        // Habilitar el botón "Ejecutar" si hay datos guardados
                        executeButton.disabled = false;
                    });
                });
            } else {
                alert("No se puede ejecutar el script en esta URL.");
            }
        } else {
            alert("Por favor, seleccione un perfil primero.");
        }
    });
    //--------------------------------------------------------------------------------
    function captureFormFields() {
        const fields = Array.from(document.querySelectorAll('input, textarea, select')).map(el => {
            let field = {
                type: el.type,
                name: el.name,
                id: el.id,
                label: el.closest('label') ? el.closest('label').textContent.trim() : null,
                span: el.closest('span') ? el.closest('span').textContent.trim() : null,
                value: el.type === 'checkbox' || el.type === 'radio' ? el.checked.toString() : el.value
            };

            // Capturar el texto del label asociado si existe
            const label = el.closest('label');
            if (label) {
                field.labelText = label.textContent.trim();
            }

            // Capturar el texto del span asociado si existe
            const span = el.closest('label') ? el.closest('label').querySelector('span') : null;
            if (span) {
                field.spanText = span.textContent.trim();
            }

            return field;
        }).filter(field => field.value && field.type !== 'hidden'); // Filtrar solo los campos que tienen un valor y no son de tipo hidden

        console.log("Campos capturados del formulario:", fields);
        return fields;
    }

    // Función para capturar los campos del formulario
    // function captureFormFields() {
    //     const fields = Array.from(document.querySelectorAll('input, textarea, select')).map(el => {
    //         if (el.type === 'checkbox' || el.type === 'radio') {
    //             return {
    //                 type: el.type,
    //                 name: el.name,
    //                 id: el.id,
    //                 value: el.checked.toString()
    //             };
    //         } else {
    //             return {
    //                 type: el.type,
    //                 name: el.name,
    //                 id: el.id,
    //                 value: el.value
    //             };
    //         }
    //     }).filter(field => field.value && field.type !== 'hidden'); // Filtrar solo los campos que tienen un valor y no son de tipo hidden
    //     console.log("Campos capturados del formulario:", fields);
    //     return fields;
    // }


    // Borrar perfiles y datos de formulario guardados
    document.getElementById('delete').addEventListener('click', async function() {
        if (selectedProfile) {
            // Borrar los datos del perfil seleccionado del almacenamiento local
            chrome.storage.local.remove(selectedProfile, () => {
                console.log(`Datos borrados para el perfil: ${selectedProfile}`);
                // Enviar mensaje para actualizar la interfaz de usuario en options.html
                chrome.runtime.sendMessage({ action: "profileDeleted", profile: selectedProfile });
            });

            // Borrar el perfil de la lista de perfiles
            profiles = profiles.filter(profile => profile !== selectedProfile);
            selectedProfile = null;
            alert("Perfil y datos asociados borrados.");
            updateProfileList(); // Actualizar la lista de perfiles en el DOM
        } else {
            alert("Por favor, seleccione un perfil primero.");
        }
    });
});