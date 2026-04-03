import express from "express";
import http from "http";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join-room", (room) => {
        socket.join(room);
        console.log(`User ${socket.id} joined room ${room}`);

        // Notify others
        socket.to(room).emit("user-joined");
    });

    socket.on("offer", (data) => {
        socket.to(data.room).emit("offer", data.offer);
    });

    socket.on("answer", (data) => {
        socket.to(data.room).emit("answer", data.answer);
    });

    socket.on("ice-candidate", (data) => {
        socket.to(data.room).emit("ice-candidate", data.candidate);
    });

    socket.on("end-call", (room) => {
        socket.to(room).emit("end-call");
    });

    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
    });
});

server.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});