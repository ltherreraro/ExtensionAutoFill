# Autofill

El ejemplo de google en el que se baso el panel corredizo se puede ver aqui: [Side Panel API](https://developer.chrome.com/docs/extensions/reference/sidePanel/).

## Funciones importantes
1. Esta funcion captura los datos del formulario, lo ideal seria poder guardar el path de js o el del selector, ya que esto facilitaria el caso donde un elemento tiene el mismo nombre para dos elementos diferentes.
```javascript
# filepath: /Auto copy/sidepanel.js

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


```
2. Funcion relacionada con el boton ejecutar que carga los datos capturaros del formulario, de igual manera lo ideal seria que se llenara teniendo en cuenta el path js o path selector, toca modificar la funcion.
```javascipt
# filepath: /Auto copy/sidepanel.js

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


```
   
