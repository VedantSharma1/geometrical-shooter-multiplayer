const express = require('express')
const app = express()
const port = 3000

//socket.io setup
const http = require('http')
const server = http.createServer(app) // creating a server based on http nut wrapping it aorund express server
const { Server } = require('socket.io');
const io = new Server(server, { pingInterval: 2000, pingTimeout: 5000})
// a server around server around server, ask chatgpt for more clari

app.use(express.static('public'))

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html')
})

const backEndPlayers = {}

const SPEED = 5

io.on('connection', (socket) => {
  console.log('a user connected')
  //creating a new player object witha property of whatever the socket id
  backEndPlayers[socket.id] = {
    x: 100 * Math.random(),
    y: 100 * Math.random(),
    color: `hsl(${360 * Math.random()}, 100%, 50%)`,
    sequenceNumber: 0
  }

  //broadcast everyone new player has joined
  io.emit('updatePlayers', backEndPlayers)

  socket.on('disconnect', (reason) => {
    console.log(reason)
    delete backEndPlayers[socket.id]
    io.emit('updatePlayers', backEndPlayers)
  })

  socket.on('keydown', ({keycode, sequenceNumber}) =>{
    backEndPlayers[socket.id].sequenceNumber = sequenceNumber
    switch(keycode){
    case 'KeyW':
      backEndPlayers[socket.id].y -= SPEED
      break
    case 'KeyA':
      backEndPlayers[socket.id].x -= SPEED
      break
    case 'KeyS':
      backEndPlayers[socket.id].y += SPEED
      break
    case 'KeyD':
      backEndPlayers[socket.id].x += SPEED
      break
  }
  })

  console.log(backEndPlayers)

});

//tick rate and all
setInterval(() => {
  io.emit('updatePlayers', backEndPlayers)
}, 1000/60) // ~16.67 tick rate industry standard

server.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

console.log('server loaded')
