
async function conectarFormulario(form, proyecto) {
    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        event.stopImmediatePropagation();

        if (!form.reportValidity()) return;

        const datos = new FormData(form);
        const valor = (campo) => datos.get(campo)?.trim() || '';

        let tipo_usuario;
        let ubicacion;
        let intereses;
        let experiencia = '';

        if (proyecto === 'CampoDirecto') {
            tipo_usuario = valor('rol');
            ubicacion = tipo_usuario === 'comprador'
                ? valor('ubicacionComprador')
                : valor('ubicacionCampesino');

            intereses = tipo_usuario === 'comprador'
                ? valor('interesComprador')
                : valor('interesCampesino');
        } else {
            tipo_usuario = valor('rol');
            ubicacion = tipo_usuario === 'trabajador'
                ? valor('ubicacionTrabajador')
                : valor('ubicacionFinca');

            intereses = tipo_usuario === 'trabajador'
                ? valor('interesTrabajador')
                : valor('interesFinca');

            experiencia = tipo_usuario === 'trabajador'
                ? intereses
                : '';
        }

        const boton = form.querySelector('[type="submit"]');
        if (boton) boton.disabled = true;

        try {
            const respuesta = await fetch('/api/registro', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    nombre: valor('nombre'),
                    correo: valor('correo'),
                    ubicacion,
                    tipo_usuario,
                    proyecto,
                    intereses,
                    experiencia
                })
            });

            const resultado = await respuesta.json();

            if (!respuesta.ok) {
                throw new Error(resultado.mensaje || 'No se pudo guardar.');
            }

            const esCampo = proyecto === 'CampoDirecto';
            const exito = document.getElementById(
                esCampo ? 'joinSuccess' : 'apJoinSuccess'
            );
            const texto = exito?.querySelector(
                '[data-role="success-text"]'
            );

            if (texto) texto.textContent = resultado.mensaje;

            form.hidden = true;
            if (exito) exito.hidden = false;
        } catch (error) {
            alert(error.message);
        } finally {
            if (boton) boton.disabled = false;
        }
    }, true);
}

conectarFormulario(
    document.getElementById('joinForm'),
    'CampoDirecto'
);

conectarFormulario(
    document.getElementById('apJoinForm'),
    'AgroPerfil'
);
