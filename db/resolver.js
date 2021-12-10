const Usuario = require("../models/Usuarios");
const bcryptjs = require("bcryptjs");
require("dotenv").config({ path: "variables.env" });
const jwt = require('jsonwebtoken');

const crearToken = (usuario,secreta,expiresIn) => {
  // console.log(usuario);
  const {id,email,nombre,apellido} = usuario;
  return jwt.sign({ id }, secreta,{expiresIn} );

};

const resolvers = {
  Query: {
    obtenerUsuario:async (_,{token}) => {
      const usuarioId= await jwt.verify(token, process.env.SECRETA)
      return usuarioId;
      
    },
  },
  Mutation: {
    nuevoUsuario: async (_, { input }) => {
      const { email, password } = input;

      // revisar si el usuario ya esta registrado
      const existeUsuario = await Usuario.findOne({ email });
      console.log(existeUsuario);
      if (existeUsuario) {
        throw new Error("El usuario ya esta registrado");
      }

      // Hashear su password
      const salt = bcryptjs.genSaltSync(10);
      input.password = bcryptjs.hashSync(password, salt);

      // Guardarlo en la base de datos
      try {
        const usuario = new Usuario(input);
        usuario.save(); // Guardado
        return usuario;
      } catch (error) {
        console.log(error);
      }
    },
    autenticarUsuario: async (_, { input }) => {
      const { email, password } = input;

      // Si el usuario existe
      const existeUsuario = await Usuario.findOne({ email });
      if (!existeUsuario) {
        throw new Error("El usuario no existe");
      }

      // revisar si el password es correcto
      const passwordCorrecto = bcryptjs.compareSync(
        password,
        existeUsuario.password
      );
      if (!passwordCorrecto) {
        throw Error("El password es incorrecto");
      }

      // Crear el token
      return {
        token: crearToken(existeUsuario, process.env.SECRETA, '24h'),
      };
    },
  },
};

module.exports = resolvers;
