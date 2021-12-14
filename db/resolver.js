const Usuario = require("../models/Usuarios");
const Producto = require("../models/Producto");
const Cliente = require("../models/Cliente");
const Pedido = require("../models/Pedido");
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");

require("dotenv").config({ path: "variables.env" });

const crearToken = (usuario, secreta, expiresIn) => {
  // console.log(usuario);
  const { id, email, nombre, apellido } = usuario;
  return jwt.sign({ id, nombre, apellido, email }, secreta, { expiresIn });
};

const resolvers = {
  Query: {
    obtenerUsuario: async (_, { token }) => {
      const usuarioId = jwt.verify(token, process.env.SECRETA);
      return usuarioId;
    },
    obtenerProductos: async () => {
      try {
        const productos = await Producto.find({});
        return productos;
      } catch (e) {
        console.log(e);
      }
    },
    obtenerProducto: async (_, { id }) => {
      // revisar si el producto existe o no
      const producto = await Producto.findById(id);

      if (!producto) {
        throw new Error("Producto no encontrado");
      }

      const { email } = input;
      return producto;
    },
    obtenerClientes: async () => {
      try {
        const clientes = await Cliente.find({});
        return clientes;
      } catch (e) {
        console.log(e);
      }
    },
    obtenerClientesVendedor: async (_, {}, ctx) => {
      try {
        const clientes = await Cliente.find({ vendedor: ctx.usuario.id });
        return clientes;
      } catch (e) {
        console.log(e);
      }
    },
    obtenerCliente: async (_, { id }, ctx) => {
      // Revisar si el cliente existe o no
      const cliente = await Cliente.findById(id);
      if (!cliente) {
        throw new Error("Cliente no encontrado");
      }
      // Quien puede verlo
      console.log(cliente.vendedor.toString());
      if (cliente.vendedor.toString() !== ctx.usuario.id) {
        throw new Error("No tienes las credenciales");
      }
      return cliente;
    },
    obtenerPedidos: async () => {
      try {
        const pedidos = await Pedido.find({});
        return pedidos;
      } catch (e) {
        console.log(e);
      }
    },
    obtenerPedidosVendedor: async (_, {}, ctx) => {
      try {
        const pedidos = await Pedido.find({ vendedor: ctx.usuario.id });
        return pedidos;
      } catch (e) {
        console.log(e);
      }
    },
    obtenerPedido: async (_, { id }, ctx) => {
      const pedido = await Pedido.findById(id);
      // Si el pedido existe o no

      if (!pedido) {
        throw new Error("Pedido no encontrado");
      }

      // solo quien lo creo puede verlo
      if (pedido.vendedor.toString() !== ctx.usuario.id) {
        throw new Error("No tienes las credenciales");
      }

      // retornar el resultado
      return pedido;
    },
    obtenerPedidosEstados: async (_, { estado }, ctx) => {
      const pedidos = await Pedido.find({ vendedor: ctx.usuario.id, estado });
      return pedidos;
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
        throw new Error("El password es incorrecto");
      }

      // Crear el token
      return {
        token: crearToken(existeUsuario, process.env.SECRETA, "24h"),
      };
    },
    nuevoProducto: async (_, { input }) => {
      try {
        const producto = new Producto(input);
        // Almacenar en la base de datos
        const resultado = await producto.save();
        return resultado;
      } catch (e) {
        console.log(e);
      }
    },
    actualizarProducto: async (_, { id, input }) => {
      // revisar si el producto existe o no
      let producto = await Producto.findById(id);

      if (!producto) {
        throw new Error("Producto no encontrado");
      }

      // guardarlo en la base de datos
      producto = await Producto.findOneAndUpdate({ _id: id }, input, {
        new: true,
      });
      return producto;
    },
    eliminarProducto: async (_, { id }) => {
      // revisar si el producto existe o no
      let producto = await Producto.findById(id);

      if (!producto) {
        throw new Error("Producto no encontrado");
      }

      //Eliminar el producto
      await Producto.findOneAndDelete({ _id: id });

      return "Producto eliminado";
    },
    nuevoCliente: async (_, { input }, ctx) => {
      console.log(ctx);
      const { email } = input;
      // Verificar si el cliente ya esta registrado

      const cliente = await Cliente.findOne({ email });
      if (cliente) {
        throw new Error("Ese cliente ya esta resgistrado");
      }
      const nuevoCliente = new Cliente(input);

      // Asignar el vendedor
      nuevoCliente.vendedor = ctx.usuario.id;
      // guardarlo en la base de datos
      try {
        const resultado = await nuevoCliente.save();
        return resultado;
      } catch (e) {
        console.log(e);
      }
    },
    actualizarCliente: async (_, { id, input }, ctx) => {
      // Verficar si existe o no
      let cliente = await Cliente.findById(id);

      if (!cliente) {
        throw new Error("Ese cliente no existe");
      }

      // Verificar si el vendedor es quien edita
      if (cliente.vendedor.toString() !== ctx.usuario.id) {
        throw new Error("No tienes las credenciales");
      }
      // Guardar el cliente
      cliente = await Cliente.findOneAndUpdate({ _id: id }, input, {
        new: true,
      });
      return cliente;
    },
    eliminarCliente: async (_, { id }, ctx) => {
      // Verficar si existe o no
      let cliente = await Cliente.findById(id);

      if (!cliente) {
        throw new Error("Ese cliente no existe");
      }

      // Verificar si el vendedor es quien edita
      if (cliente.vendedor.toString() !== ctx.usuario.id) {
        throw new Error("No tienes las credenciales");
      }

      // Eliminar Cliente
      await Cliente.findOneAndDelete({ _id: id });
      return "Cliente Eliminado";
    },
    nuevoPedido: async (_, { input }, ctx) => {
      const { cliente } = input;

      // Verificar si existe el cliente o no
      let existeCliente = await Cliente.findById(cliente);
      if (!existeCliente) {
        throw new Error("Ese cliente no existe");
      }

      // Verificar si el cliente es del vendedor
      if (existeCliente.vendedor.toString() !== ctx.usuario.id) {
        throw new Error("No tienes las credenciales");
      }

      // Revisar que el stock este disponible
      for await (const articulo of input.pedido) {
        console.log(articulo);

        const { id } = articulo;
        const producto = await Producto.findById(id);

        console.log(producto);

        if (articulo.cantidad > producto.existencia) {
          throw new Error(
            `El articulo: ${producto.nombre} excede la cantidad disponible`
          );
        } else {
          // Restar la cantidad disponible
          producto.existencia = producto.existencia - articulo.cantidad;
          await producto.save();
        }
      }

      // Crear un nuevo pedido
      const nuevoPedido = new Pedido(input);

      // Asignar un vendedor
      nuevoPedido.vendedor = ctx.usuario.id;

      // Guardarlo en la base de datos
      const resultado = await nuevoPedido.save();
      return resultado;
    },
    actualizarPedido: async (_, { id, input }, ctx) => {
      const { cliente } = input;
      // Si el pedido existe
      const existePedido = await Pedido.findById(id);
      if (!existePedido) {
        throw new Error("El pedido no existe");
      }
      // Si el cliente existe
      const existeCliente = await Cliente.findById(cliente);
      if (!existeCliente) {
        throw new Error("El cliente no existe");
      }

      // Si el cliente y pedido pertecene al vendedor
      if (existeCliente.vendedor.toString() !== ctx.usuario.id) {
        throw new Error("No tienes las credenciales");
      }

      // Revisar el stock
      if (input.pedido) {
        for await (const articulo of input.pedido) {
          console.log(articulo);

          const { id } = articulo;
          const producto = await Producto.findById(id);

          console.log(producto);

          if (articulo.cantidad > producto.existencia) {
            throw new Error(
              `El articulo: ${producto.nombre} excede la cantidad disponible`
            );
          } else {
            // Restar la cantidad disponible
            producto.existencia = producto.existencia - articulo.cantidad;
            await producto.save();
          }
        }
      }

      // guardar el pedido
      const resultado = await Pedido.findOneAndUpdate({ _id: id }, input, {
        new: true,
      });

      return resultado;
    },
    eliminarPedido: async (_, { id }, ctx) => {
      // verificar si el pedido existe o no
      const pedido = await Pedido.findById(id);
      if (!pedido) {
        throw new Error("El pedido no existe");
      }

      // verificar si el vendedor ese quien lo borra
      if (pedido.vendedor.toString() !== ctx.usuario.id) {
        throw new Error("No tienes las credenciales");
      }

      // eliminar de la base de datos
      await Pedido.findOneAndDelete({ _id: id });
      return "Pedido eliminado";
    },
  },
};

module.exports = resolvers;
