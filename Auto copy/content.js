// Escucha mensajes enviados desde el popup o la página de opciones
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "captureFormFields") {
        // Captura todos los campos de formularios en la página
        const fields = Array.from(document.forms).flatMap(form =>
            Array.from(form.elements).map(el => ({
                type: el.type,
                name: el.name,
                value: el.value
            }))
        );

        // Devuelve los campos capturados
        sendResponse({ fields });
    } else if (message.action === "fillForm") {
        const profile = message.profile;

        // Rellena los formularios en la página con los datos del perfil
        profile.forEach(field => {
            const input = document.querySelector(`[name="${field.name}"]`);
            if (input) {
                input.value = field.value;
                // Forzar eventos para que los cambios se reflejen en tiempo real
                input.dispatchEvent(new Event("input", { bubbles: true }));
                input.dispatchEvent(new Event("change", { bubbles: true }));
            }
        });

        sendResponse({ status: "Formulario rellenado" });
    }
});