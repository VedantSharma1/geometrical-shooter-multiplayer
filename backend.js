
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
const backEndProjectiles = {}
const SPEED = 3
const RADIUS = 10
const PROJECTILE_RADIUS = 5
const PROJECTILE_SPEED = 10
let projectileId = 0

io.on('connection', (socket) => {
  console.log('a user connected')
  

  //broadcast everyone new player has joined
  io.emit('updatePlayers', backEndPlayers)

  socket.on('shoot', ({x, y, angle}) => {
    projectileId++

    const velocity = {
    x: Math.cos(angle) * PROJECTILE_SPEED,
    y: Math.sin(angle) * PROJECTILE_SPEED
  }

    backEndProjectiles[projectileId] = {
      x,
      y,
      velocity,
      playerId: socket.id
    }
  })

  socket.on('initGame',({username, width, height}) => {
    //creating a new player object witha property of whatever the socket id
    backEndPlayers[socket.id] = {
      x: width * Math.random(), // random vals bw 0.1-0.7
      y: height * (Math.random() * (0.7 - 0.1) + 0.1), //576 * Math.random()
      color: `hsl(${360 * Math.random()}, 100%, 50%)`,
      sequenceNumber: 0,
      score: 0,
      username
    }
    //where we init our canvas
    backEndPlayers[socket.id].canvas = {
      width,
      height
    }

    backEndPlayers[socket.id].radius = RADIUS
    
  })

  socket.on('disconnect', (reason) => {
    console.log(reason)
    delete backEndPlayers[socket.id]
    io.emit('updatePlayers', backEndPlayers)
  })

  socket.on('keydown', ({keycode, sequenceNumber}) =>{
    const backEndPlayer = backEndPlayers[socket.id]

    if ( !backEndPlayers[socket.id] ) return
    
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
    // const playerSides = {
    //   left: backEndPlayer.x - backEndPlayer.radius,
    //   right: backEndPlayer.x + backEndPlayer.radius,
    //   top: backEndPlayer.y - backEndPlayer.radius,
    //   bottom: backEndPlayer.y + backEndPlayer.radius
    // }

    const canvas = backEndPlayers[socket.id].canvas

    if ((backEndPlayer.x - backEndPlayer.radius) < 0){
      backEndPlayer.x = backEndPlayer.radius
    }
    else if ((backEndPlayer.x + backEndPlayer.radius) > canvas.width){
      backEndPlayer.x = canvas.width - backEndPlayer.radius
    }

    // y bounds
    if ((backEndPlayer.y - backEndPlayer.radius) < 0){
      backEndPlayer.y = backEndPlayer.radius
    }
    else if ((backEndPlayer.y + backEndPlayer.radius) > canvas.height){
      backEndPlayer.y = canvas.height - backEndPlayer.radius
    }

  })

});

//tick rate and all , backend
setInterval(() => {
  //update proj position
  for (const id in backEndProjectiles){
    backEndProjectiles[id].x += backEndProjectiles[id].velocity.x
    backEndProjectiles[id].y += backEndProjectiles[id].velocity.y
    
    //garbage colection deleting projectiles
    //improve this logic what if someone is paying on half screen and
    //someone full screen, the projectiles just disappear for the full the
    // full screen (he was talking about some camera controlled movement like slither)
    // but right now you can work with some large fixed values or if you have a world
    //you can do world bound checks

    
    // if (backEndProjectiles[id].x - PROJECTILE_RADIUS >= backEndPlayers[
    //   backEndProjectiles[id].playerId]?.canvas?.width || 

    //   backEndProjectiles[id].x + PROJECTILE_RADIUS <= 0 ||

    //   backEndProjectiles[id].y - PROJECTILE_RADIUS >= backEndPlayers[
    //   backEndProjectiles[id].playerId]?.canvas?.height || 

    //   backEndProjectiles[id].y + PROJECTILE_RADIUS <= 0){

    //   delete backEndProjectiles[id]
    // }
    
    if (backEndProjectiles[id].x - PROJECTILE_RADIUS >= 3000 || 

      backEndProjectiles[id].x + PROJECTILE_RADIUS <= 0 ||

      backEndProjectiles[id].y - PROJECTILE_RADIUS >= 3000 || 

      backEndProjectiles[id].y + PROJECTILE_RADIUS <= 0){

      delete backEndProjectiles[id]
      continue;
    }
    
    //calculcating ditance between alllt he projectiles nad the players
    for (const playerId in backEndPlayers){

      const backEndPlayer = backEndPlayers[playerId]
      const DISTANCE = Math.hypot(
        backEndProjectiles[id].x - backEndPlayer.x,
        backEndProjectiles[id].y - backEndPlayer.y)

        if (DISTANCE < PROJECTILE_RADIUS + backEndPlayer.radius &&
          backEndProjectiles[id].playerId !== playerId){
          
          //projectile hits a user when he disconnected
          if (backEndPlayers[backEndProjectiles[id].playerId]){
            backEndPlayers[backEndProjectiles[id].playerId].score++
          }
          
          delete backEndProjectiles[id]
          delete backEndPlayers[playerId]
          break
        }
    }
    
    
    //console.log(backEndProjectiles[id])

  }

  io.emit('updateProjectiles', backEndProjectiles)
  io.emit('updatePlayers', backEndPlayers)
}, 15) 

server.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

console.log('server loaded')
