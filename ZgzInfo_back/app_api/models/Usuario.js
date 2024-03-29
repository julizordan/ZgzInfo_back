const mongoose = require('mongoose');

const usuarioSchema = new mongoose.Schema({
    email: {type: String, required: true, unique: true},
    password: {type: String, required: true, minLength: 6},
    bloqueado: {type: Boolean, default: false},
    incidencia: [{type: mongoose.Schema.Types.ObjectId, ref: 'Incidencia', default: []}],
    tipo_incidencia: { type: [String], required: false, default: [] },
    foro: { type: [String], required: false, default: [] },
    fechaRegistro: {type: Date, default: Date.now}
});

const Usuario = mongoose.model('Usuario', usuarioSchema);

module.exports = Usuario;