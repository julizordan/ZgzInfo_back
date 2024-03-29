const mongoose = require('mongoose');
const Usuario = mongoose.model('Usuario');
const Incidencia = mongoose.model('Incidencia');

/*
* POST /api/register
* { "email": "juli@gmail.com",
    "password": "lololo"
  }
*/
const userCreate = async (req, res) => {
    const {email, password} = req.body;
    try {
        const usuarioEncontrado = await Usuario.findOne({email: email});
        if (usuarioEncontrado) {
            return res.status(404).json({mensaje: 'Usuario ya registrado encontrado'});
        }
        const newUser = new Usuario({
            email: email,
            password: password
        });
        // Validar si se está probando en Swagger
        if (!req.headers['user-agent'].includes('swagger')) {
            await newUser.save();
            console.log(req.url);
        }
        res.status(200).json({mensaje: 'Usuario creado exitosamente'});
    } catch (error) {
        console.log(error);
        res.status(500).send(error);
    }
};


// PUT /api/register/:email
const userUpdate = async (req, res) => {
    console.log(`email ${req.params.email}`);
    console.log(`password ${req.body.password}`);
    if (!req.params.email) {
        return res.status(404).json({mensaje: 'se requiere un email'});
    }
    //const user = await user.findById(req.params.userId).exec();
    Usuario.findOne({email: req.params.email})
        .exec()
        .then(user => {
            if (!user) {
                console.log('Usuario no encontrado');
                return res.status(404).json({mensaje: 'Usuario no encontrado'});
            } else {
                user.password = req.body.password;
                user.save();
                return res.status(200).json({mensaje: `hemos cambiado la contraseña ${user.password}`});
            }
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({
                "message": "Internal server error"
            });
        });
};

// POST /api/login
const userLogin = async (req, res) => {
    const {email, password} = req.body;
    console.log(email);
    console.log(password);
    if (!email || !password) {
        return res.status(404).json({
            "message": "Email y password requeridos"
        });
    }
    Usuario.findOne({email: req.body.email, password: req.body.password})
        .exec()
        .then(user => {
            if (!user) {
                console.log('Usuario no encontrado');
                return res.status(404).json({
                    "message": "Usuario no encontrado"
                });
            } else {
                console.log('Usuario encontrado');
                return res.status(200).json({mensaje: 'Usuario encontrado'});
            }
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({
                "message": "Internal server error"
            });
        });
};

//GET  /api/grafica/NumUsuariosIncidencia
const NumUsuariosIncidencia = async (req, res) => {
      try {
        const result = await Usuario.aggregate([
          {
            $unwind: '$tipo_incidencia'
          },
          {
            $group: {
              _id: '$tipo_incidencia',
              numUsuarios: { $sum: 1 }
            }
          }
        ]);
    
        const response = result.reduce((acc, cur) => {
          acc[cur._id] = cur.numUsuarios;
          return acc;
        }, {});
    
        res.json(response);
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener el numero de usuarios por tipo de incidencia' });
      }
  
};

//GET  /api/grafica/numeroIncidenciasTipo
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

module.exports = {
    userCreate,
    userUpdate,
    userLogin,
    NumUsuariosIncidencia,
    numeroIncidenciasTipo
};
