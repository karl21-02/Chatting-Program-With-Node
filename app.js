var app = require('express')(); // express라는 모듈을 요청하여 http객체에 담아 핸들링
var http = require('http');
const express = require('express');
var server = http.createServer(app); // 서버 생성 및 제어
var io = require('socket.io')(server); // http에 socket.io 인스턴스 초기화

app.use(express.static('views'));

// const play = require('audio-play');
// const load = require('audio-loader');

let room = [ 'Room1', 'Room2' ];
let a = 0;

// index.html 반환
app.get('/*', function(req, res){ // 웹 사이트를 방문시 호출 되는 경로 ( '/' )
    // path의 파일을 읽고 해당 내용을 클라이언트로 전송
    res.sendFile('/ChatingService/views/index.html');
});

//////////////////////////////////////////////////////////

// connect event
io.on('connection', function(socket){
    
    // disconnect event
    socket.on('disconnect', function(){
        console.log(socket.name + " " + 'disconnected');
    });
});

io.on('connection', function(socket) {
    socket.on('joinRoom', (num, name) => {
        socket.join(room[num], () => {
            console.log(name + ' join a ' + room[num]);
            io.to(room[num]).emit('joinRoom', num, name);
        })
    })

    socket.on('leaveRoom', (num, name) => {
        socket.leave(room[num], () => {
            console.log(name + ' leave a ' + room[num]);
            io.to(room[num]).emit('leaveRoom', num, name);
        })
    })

    socket.on('roomChat', (num, name, msg) => {
        a = num;
        io.to(room[a]).emit('roomChat', name, msg);
    })
});

io.on('connection', function(socket){

    // 메세지 받기
    socket.on('chat message', function(msg){
        console.log(msg.user_name + ': ' + msg.message);
        // load('./sound2.mp3').then(play);
        // 브로드 캐스팅
        io.emit('chat message', msg);
    });

    socket.on("newUser", function(name) {

        console.log(name + " connected");

        // 소켓에 이름 저장해 두기
        socket.name = name;

        // 모든 소켓에게 전송 - 브로드 캐스팅
        io.emit("update", socket.name);
    });

    // 사용자 로그인 메시지 출력
    socket.on('user_connect', function(user_name) {
        console.log(user_name + " is logged in");
        io.emit("user_connect", user_name);
    });
});

io.on('connection', function(socket){
    socket.on("make_room", function(new_room_name) {
        console.log(new_room_name + " is created");
        // room.push(new_room_name);
        io.emit("make_room", new_room_name);
    });
});

/////////////////////////////////////////////
// 이미지 서버

const path = require('path');
const multer = require('multer');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "Images")
    },
    filename: (req, file, cb) => {
        console.log(file)
        cb(null, Date.now() + path.extname(file.originalname))
    }
});

const upload = multer({storage: storage})

// app.use('/public', express.static('Images'));

app.set('views', path.join(__dirname, 'views'));
app.engine('html', require('ejs').renderFile);
app.set("view engine", "html");

app.get("/index", (req, res) => {
    res.render("index");
});

app.post("/index", upload.single("image"), (req, res) => {
    res.send("Image Uploaded");
});

//////////////////////////////////////////////

server.listen(3000, function(){ // http 서버가 포트 3000에서 수신 대기
    console.log('listening on *:3000');
});