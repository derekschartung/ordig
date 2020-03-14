'use strict'
const fs = require('fs')
const express = require('express')
const sqlite3 = require('sqlite3').verbose()
const swaggerUi = require('swagger-ui-express')
const init_server = require('./init_server')
const YAML = require('yamljs')
const swaggerDocument = YAML.load('./openapi.yml')
const db = new sqlite3.Database('/data/wg.sqlite3')

const wg_pool = process.env.WG_POOL || '10.10.10.0/24'
const wg_ip = process.env.WG_IP || '10.10.10.1'
const wg_endpoint = process.env.WG_ENDPOINT || 'wg.example.com'
const wg_port = process.env.WG_PORT || '51280'
const wg_allowed = process.env.WG_ALLOWED || '10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/24'
const wg_api_key = fs.readFileSync('/run/secrets/wg_api_key')
const wg_client_api_key = fs.readFileSync('/run/secrets/wg_client_api_key')

const app = express()

app.use(express.json())

// host swagger doc
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))

// require API keys
const server_url_re = /^\/api\/v[0-9]\/server/
const client_url_re = /^\/api\/v[0-9]\/client/
app.use((req, res, next) => {
  if(server_url_re.test(req.path)){
    if(req.get('Authorization')){
      const auth = req.get('Authorization').split(' ')
      if(auth[1]){
        const token = auth[1]
        if(token == wg_api_key){
          next()
        }else{
          res.status(401).send('invalid token')
        }
      }else{
        res.status(401).send('invalid token')
      }
    }else{
      res.status(401).send('invalid token')
    }
  }else if(client_url_re.test(req.path)){
    if(req.get('Authorization')){
      const auth = req.get('Authorization').split(' ')
      if(auth[1]){
        const token = auth[1]
        if(token == wg_client_api_key){
          next()
        }else{
          res.status(401).send('invalid token')
        }
      }else{
        res.status(401).send('invalid token')
      }
    }else{
      res.status(401).send('invalid token')
    }
  }
})


// generate or get server keypair
init_server(db, (err, server_keypair) => {
  if(err){
    console.error('Error initializing server: ', err)
    process.exit(1)
  }

  // send server config
  app.use('/api/v1/server/config', (req, res) => {
    res.send({
      ip: wg_ip,
      port: wg_port,
      private_key: server_keypair.private_key
    })
  })

  // test client
  app.use('/api/v1/client', (req, res) => {
    res.send({
      wg_endpoint: wg_endpoint,
      wg_port: wg_port,
      wg_allowed: wg_allowed,
      public_key: server_keypair.public_key
    })
  })
})

app.listen(9000, () => console.log('API listening on port 9000'))