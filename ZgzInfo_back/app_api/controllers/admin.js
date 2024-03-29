const mongoose = require('mongoose');
const Usuario = mongoose.model('Usuario');
const Comentario = mongoose.model('Comentario');
const Foro = mongoose.model('Foro');
const Incidencia = mongoose.model('Incidencia');


//GET  /api/admin/listadoUsuarios

const listarUsuarios = async (req, res) => {
    try {
        const usuarios = await Usuario.find({}, 'nombre apellido email bloqueado'); // obtener todos los usuarios y solo seleccionar nombre, apellido y correo
        res.status(200).json(usuarios); // responder con un objeto JSON que contiene la lista de usuarios
    } catch (error) {
        console.error(error);
        res.status(500).json({mensaje: 'Error al obtener los usuarios'});
    }
}

// PUT /api/admin/{email}/bloquear
const bloquearUsuario = async (req, res) => {
    if (!req.params.email) {
        return res.status(404).json({
            "message": "Not found, email is required"
        });
    }
    try {
        const user = await Usuario.findOne({ email: req.params.email }).exec();
        if (!user) {
            console.log('Usuario no encontrado');
            return res.status(404).json({
                "message": "Usuario no encontrado"
            });
        } else {
            user.bloqueado = true;
            const savedUser = await user.save();
            return res.status(200).json({ mensaje: 'Usuario bloqueado correctamente',savedUser});
        }
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            "message": "Internal server error"
        });
    }
}

//GET  /api/admin/listadoMensajes/{email}
const listadoMensajes = async (req, res) => {
    if (!req.params.email) {
        res.status(404).json({
            "message": "Not found, userId is required"
        });
        return;
    }
    try {
        const usuario = await Usuario.findOne({email: req.params.email});
        if (!usuario) {
            return res.status(404).json({
                "message": "Usuario no encontrado"
            });
        }
        const comentarios = await Comentario.find({ usuario: usuario._id }).select('comentario -_id');
        return res.status(200).json(comentarios);
    } catch (error) {
        console.error(error);
        res.status(500).json({message: 'Hubo un error al obtener los mensajes del usuario'});
    }

}

// DELETE /api/admin/eliminarMensaje/{email}
const eliminarMensaje = async (req, res) => {
    if (!req.params.email) {
        return res.status(404).json({
            "message": "Not found, email is required"
        });
    }

    try {
        const usuario = await Usuario.findOne({email: req.params.email});
        if (!usuario) {
            return res.status(404).json({
                "message": "Usuario no encontrado"
            });
        }
        // Eliminar todos los comentarios asociados al usuario
        const result = await Comentario.deleteMany({usuario: usuario._id});
        if (result.deletedCount === 0) {
            return res.status(404).json({
                "message": "El usuario no tiene comentarios"
            });
        }
        return res.status(200).json({message: 'Comentarios eliminados exitosamente'});
    } catch (error) {
        console.error(error);
        res.status(500).json({message: 'Hubo un error al eliminar los comentarios del usuario'});
    }
}

//GET  /api/admin/listadoForos
const listarForos = async (req, res) => {
    try {
        const foros = await Foro.find({}, {id: 1, tipo: 1, titulo: 1});
        return res.status(200).json(foros);
    } catch (error) {
        console.error(error);
        return res.status(500).json({mensaje: 'Error al obtener los foros'});
    }
}

// DELETE  /api/admin/{idForo}/eliminar
const eliminarForo = async (req, res) => {
    if (!req.params.idForo) {
        return res.status(404).json({
            "message": "Not found, foroId is required"
        });

    }
    try {
        const foro = await Foro.findOne({id: req.params.idForo});
        if (!foro) {
            return res.status(404).json({
                "message": "Foro no encontrado"
            });
        }
        await Foro.findByIdAndRemove(foro._id);
        // Devolver respuesta exitosa
        return res.status(200).json({mensaje: 'Foro eliminado exitosamente'});
    } catch (error) {
        console.error(error);
        res.status(500).json({message: 'Hubo un error al eliminar el foro'});
    }

}


//GET  /api/admin/grafica/numeroIncidenciasTipo
const numeroIncidenciasTipo = async (req, res) => {
    try {
        const incidenciasPorTipo = await Incidencia.aggregate([
            {
                $group: {
                    _id: "$tipo",
                    count: {$sum: 1}
                }
            }
        ]);
        res.status(200).json(incidenciasPorTipo);
    } catch (error) {
        res.status(500).json({error: "Error al obtener las incidencias por tipo."});
    }
}


//GET  /api/admin/grafica/NumIncidenciasHoy
const NumIncidenciasHoy = async (req, res) => {
    try {
        const hoy = new Date();
        const numTotalIncidencias = await Incidencia.countDocuments();
        const numIncidenciasFinHoy = await Incidencia.countDocuments({
            fin: {
                $gte: hoy.setHours(0, 0, 0, 0),
                $lt: hoy.setHours(23, 59, 59, 999)
            }
        });

        res.status(200).json({numTotalIncidencias, numIncidenciasFinHoy});
    } catch (error) {
        res.status(500).json({error: "Error al obtener el número de incidencias y las incidencias con fecha de fin de hoy."});
    }
};

//GET  /api/admin/grafica/numUsuariosRegistrados
const NumUsuariosRegistrados = async (req, res) => {
    try {
        const mesActual = new Date().toLocaleString('es-ES', {month: 'long'});
        const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const finMes = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59, 999);

        const numUsuarios = await Usuario.countDocuments({
            createdAt: {$gte: inicioMes, $lte: finMes}
        });

        const respuesta = {
            mes: mesActual,
            numUsuarios: numUsuarios
        };

        res.status(200).json(respuesta);

    } catch (error) {
        res.status(500).json({error: "Error al obtener el número de usuarios registrados este mes."});
    }
};


//GET  /api/admin/grafica/numUsuariosBloqueados
const NumUsuariosBloqueados = async (req, res) => {
    try {
        const mesActual = new Date().toLocaleString('es-ES', {month: 'long'});

        const numUsuarios = await Usuario.countDocuments({});
        const numUsuariosBloqueados = await Usuario.countDocuments({bloqueado: true});

        const respuesta = {
            mes: mesActual,
            numUsuarios: numUsuarios,
            numUsuariosBloqueados: numUsuariosBloqueados
        };

        res.status(200).json(respuesta);
    } catch (error) {
        res.status(500).json({error: "Error al obtener el número de usuarios."});
    }
};


module.exports =
    {
        listarUsuarios,
        bloquearUsuario,
        listadoMensajes,
        eliminarMensaje,
        listarForos,
        eliminarForo,
        numeroIncidenciasTipo,
        NumIncidenciasHoy,
        NumUsuariosRegistrados,
        NumUsuariosBloqueados
    };