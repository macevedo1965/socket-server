// server.js (o donde tengas tu servidor Socket.io)
import express from "express";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import dotenv from "dotenv";
import { Server } from "socket.io";

dotenv.config();
const PORT = process.env.PORT || 6534;

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.NEXT_PUBLIC_CLIENT_URL || "http://localhost:3000", // Permite la conexión desde tu app Next.js
    methods: ["GET", "POST"],
  },
});

const __dirname = dirname(fileURLToPath(import.meta.url));

io.on("connection", (socket) => {
  console.log(`Usuario conectado: ${socket.id}`);

  // Evento para que un Specialist se una a una sala de tipo de examen
  socket.on("joinExamRoom", ({ userId, examType }) => {
    // Puedes verificar aquí si el userId es un Specialist y si está suscrito a ese examType
    // Por simplicidad, unimos directamente por ahora
    const roomName = `exam_${examType}`;
    socket.join(roomName);
    console.log(
      `Usuario ${userId} (socket: ${socket.id}) se unió a la sala: ${roomName}`
    );
  });

  // Evento cuando un Technician sube un examen
  socket.on(
    "newExamUploaded",
    ({ examId, patientId, examType, technicianId }) => {
      console.log(
        `Nuevo examen subido: ${examId}, Tipo: ${examType}, por Technician: ${technicianId}`
      );
      const roomName = `exam_${examType}`;
      // Emitir a todos los Specialists en la sala de ese tipo de examen
      io.to(roomName).emit("examNotification", {
        message: `¡Nuevo examen de ${examType} disponible!`,
        examId,
        patientId,
        examType,
        type: "newExam",
      });
      console.log(
        `Notificación de nuevo examen emitida a la sala: ${roomName}`
      );
    }
  );

  // Evento cuando un Specialist reporta un examen
  socket.on("examReported", ({ examId, patientId, specialistId }) => {
    console.log(`Examen ${examId} reportado por Specialist: ${specialistId}`);
    // Aquí puedes emitir directamente al Patient o a la sala del Patient si tuvieras una
    // Para simplificar, asumiremos que el Patient necesita ser notificado y actualice su lista de archivos.
    // Podríamos tener una sala para cada Patient (patient_id)
    // Por ahora, emitiremos una notificación que tu aplicación Next.js manejará para actualizar la lista de archivos.
    io.emit("reportNotification", {
      message: `Tu examen ${examId} ha sido informado.`,
      examId,
      patientId,
      type: "examReported",
    });
    console.log(
      `Notificación de reporte de examen emitida para examen: ${examId}`
    );
  });

  socket.on("disconnect", () => {
    console.log(`Usuario desconectado: ${socket.id}`);
  });
});

server.listen(PORT, () => {
  console.log("Servidor Socket.io corriendo en http://localhost:" + PORT);
});
