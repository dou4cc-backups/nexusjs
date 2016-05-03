const socket = new Nexus.IO.UDPSocketDevice();
socket.on('attempt', (v,w) => console.log("attempting to connect to: " + v));
socket.on('connected', (v,w) => console.log("connected to: " + v + " on port " + w));
socket.connect('127.0.0.1', 3000).then(socket => {
  console.log('sending data!');
  const wstream = new Nexus.IO.WritableStream(socket);

  const fileDevice = new Nexus.IO.FilePushDevice('enwik16-0');
  const stream = new Nexus.IO.ReadableStream(fileDevice);

  stream.pipe(wstream).then(_ => {
    console.log("finished!")
  }, e => console.error(e));

}, e => console.error(e));