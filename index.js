const amqp = require('amqplib/callback_api');

const ALTERNATE_EXCHANGE_NAME = 'discarded';

class Consumer {
  constructor(config) {
    this._connection = config.connection;
    this._channel = config.channel;
    this._queue = config.queue_name;
    this._routing_key = config.routing_key;
  }

  consume(handler, options = { noAck: true }) {
    this._channel.consume(this._queue, handler, options);
  }

  close() {
    this._connection.close();
  }
}

function createChannel(connection) {
  return new Promise((resolve, reject) => {
    connection.createChannel(function(err, channel) {
      err == null ? resolve(channel) : reject(err);
    });
  });
}

function createConnection(hostname, username, password) {
  return new Promise((resolve, reject) => {
    amqp.connect(
      {
        hostname: hostname,
        username: username,
        password: password
      },
      function(err, connection) {
        err == null ? resolve(connection) : reject(err);
      }
    );
  });
}

async function createConsumer(config) {
  const connection = await createConnection(
    config.host,
    config.username,
    config.password
  );
  const channel = await createChannel(connection);

  await channel.assertQueue(config.queue_name, {
    exclusive: config.exclusive,
    durable: config.durable,
    autoDelete: config.autoDelete,
    messageTtl: config.ttl
  });

  if (config.exchange_name != '') {
    await channel.assertExchange(config.exchange_name, config.exchange_type, {
      autoDelete: true,
      alternateExchange: ALTERNATE_EXCHANGE_NAME
    });

    await channel.bindQueue(
      config.queue_name,
      config.exchange_name,
      config.routing_key
    );
  }

  const consumerConfig = { ...config, connection, channel };

  return new Consumer(consumerConfig);
}

a = async ()=>{
  const consumer = await createConsumer({
    host: 'localhost',
    username: 'guest',
    password: 'guest',
    exchange_name: 'service.event',
    exchange_type: 'direct',
    queue_name: 'session_update',
    exclusive: false,
    durable: false,
    autoDelete: true,
    ttl: undefined,
    routing_key: 'session.updated'
  });

    function regradingHandler(message) {
      try {
        const event = JSON.parse(message.content.toString());
        console.log(event)
      } catch (err) {
        handleError(err);
      }
    }
    
    
    consumer.consume(regradingHandler)
}
a()