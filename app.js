const inicioDebug = require('debug')('app:inicio');
const dbDebug = require('debug')('app:db');
const express = require('express'); //Importar express
const config = require('config');
const logger = require('./logger');
const morgan = require('morgan');
const joi = require('joi');
const app = express();  // Crea una instancia de express

//Middleware
//El middleware es un bloque de codigo que se ejecuta
//entre las peticiones del usuario (cleinte) y el request 
//que llega al servidor. Es un enlace entre la peticion
//del usuario y el servidor, antes de que este pueda dar una respuesta

//Las funciones de middleware son funciones que tienen acceso
//al objeto de peticion (req, res), al objeto de respuesta (response)
// y a la siguiente funcion de middleware en el ciclo de peticiones/respuesta
//de la aplicaion. La siguiente funcion de middleware se denota 
//normalmenre con una variabe denominada next

//Las funciones de middleware pueden realizar las siguientes tareas:
//      --Ejecutar cualquier codigo
//      -- Realizar cambios en la peticion y los objetos de respuesta
//      -- Finalizar el ciclo de peticion respuesta
//      --Invocar la siguiente funcion de middleware en la pila

//Express es un framework de direccionamiento y de uso de middleware
// que permite que la aplicacion tenga funcionalidad minima propia

// Ya usamos algunos middleware como express.json()
// trasnforma el body del req a formato JSON

//          -----------------------
//request -|-> json() --> route() -|-> response
//          -----------------------

//route() --> funciones GET, POST, PUT, DELETE

//JSON hace un parsing de la entrada a formato JSON
//de tal forma que lo que recibamos en el req de una
//peticion esta en formato JSON
app.use(express.json());    //Se le dice a express que use este moddleware
app.use(express.urlencoded({extended:true}));
// public es el nombre de la carpeta que tendrá los recursos estáticos
app.use(express.static('public'));

console.log(`Aplicación: ${config.get('nombre')}`);
console.log(`DB server: ${config.get('configDB.host')}`);

// Uso de middleware de tercero -morgan
if(app.get('env') == 'development'){
    app.use(morgan('tiny'));
    inicioDebug('Morgan está habilitado...');
}

// Operaciones con la base de datos 
dbDebug('Conectando a la base de datos...');
//app.use(logger);    // logger ya hace referencia a la función log (exports)

//app.use(function(req, res, next){
    //console.log('Autentificando...');
    //next();
//});

// Query string 
// url/?var1=valor1&var2=valor2&var3=valor3....
// Hay cuatro tipos de peticiones
//Asociada con las operaciones CRUD de una base de datos

/*app.get();  //Consulta de datos
app.post(); //Envia datos al servidor(insertar datos)
app.put();  //Actualiza datos
app.delete()    //Elimina datos*/

const usuarios = [
    {id:1, nombre:'Juan'},
    {id:2, nombre:'Ana'},
    {id:3, nombre:'Marty'},
    {id:4, nombre:'Luis'}
];

//Consulta en la ruta raiz de nuestro servidor
//Con una funcion callback
app.get('/', (req, res) => {
    res.send('Hola mundo desde Express');
});

app.get('/api/usuarios', (req, res) => {
    res.send(usuarios);
});

//Como pasar parametros dentro de las rutas
//Con los dos puntos delante del id Express
//sabe que es un paramentro a recibir
app.get('/api/usuarios/:id', (req, res) =>{
    let usuario = existeUsuario(req.params.id);
    if(!usuario)
        res.status(404).send('El usuario no se encuentra'); //Devuelve el estado http
    res.send(usuario)
})

//Peticion POST
//Tiene el mismo nombre que la peticion GET
//Express hace la diferencia dependiente del tipo de peticion
/*//El objeto req tiene la propiedad body
    i*/
app.post('/api/usuarios', (req, res) => {
    // El objto res tiene  la propiedad body 
    const {value, error} = ValidarUsuario(req.body.nombre);
    if(!error){
        const usuario = {
            id:usuarios.length + 1,
            nombre:req.body.nombre
        };
        usuarios.push(usuario);
        res.send(usuario);
    }
    else{
        const mensaje = error.details[0].message;
        res.status(400).send(mensaje);
    } 
});

//Peticion PUT
//Metodo para actualizar informacion
//Recibe el id del usuario que se quiere modificar
//Utilizando un parametro en la ruta :id
app.put('/api/usuarios/:id', (req, res)=>{
    //Validar que el usuario se encuentre
    //en los registros
    let usuario = existeUsuario(req.params.id);
    if(!usuario){
        res.status(404).send('El usuario no se encuentra'); //Devuelve el estado http
        return;
    }
    //En el body del request debe venir la informacion
    //para hacer la actualizacion.
    //Validar que el nombre cumpla con las condicioens
   
    const {value, error} = ValidarUsuario(req.body.nombre);
    if(error){
        const mensaje = error.details[0].message;
        res.status(400).send(mensaje);
        return;
    }
    //Actualiza el nombre del usuario
    usuario.nombre = value.nombre;
    res.send(usuario);
});

// Peticion DELETE
//Metodo para eliminar informacion
//Recibe el id del usuario que se quiere modificar
//Utilizando un parametro en la ruta :id
app.delete('/api/usuarios/:id', (req, res)=>{
    const usuario = existeUsuario(req.params.id);
    if(!usuario){
        res.status(404).send('El usuario no se encuentra');
        return;
    }
    // Encontrar el indice del usuario dentro del arreglo
    const index = usuarios.indexOf(usuario);
    usuarios.splice(index, 1);  //Elimina el elemento en el indice indicado
    res.send(usuario); //Responde con el usuario eliminado
});

//Usando el modulo process, se lee una variable 
//de entorno
//console.log(process.env)
//Si la variable no existe, va a tener un valor
//por default (3000)
const port = process.env.PORT || 3000;

app.listen(port, () =>{
    console.log(`Escuchando en el puerto ${port}....`);
});

function existeUsuario(id){
    return(usuarios.find(u => u.id === parseInt(id)));
}

function ValidarUsuario(nom){
    const schema = joi.object({
        nombre:joi.string().min(3).required()
    });
    return (schema.validate({nombre:nom}));
}