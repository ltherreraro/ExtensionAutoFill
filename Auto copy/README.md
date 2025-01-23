# Autofill

El ejemplo de google en el que se baso el panerl corredizo se puede ver aqui: [Side Panel API](https://developer.chrome.com/docs/extensions/reference/sidePanel/).

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
```Javascipt
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
   
