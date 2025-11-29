
export function emitToAll(event: string, data: any) {
  const io = (global as any).io;
  if (io) {
    io.emit(event, data);
  }
}

export function emitToUser(userId: string, event: string, data: any) {
  const io = (global as any).io;
  if (io) {
    io.to(`user_${userId}`).emit(event, data);
  }
}

export function emitToRole(role: string, event: string, data: any) {
  const io = (global as any).io;
  if (io) {
    io.to(`role_${role}`).emit(event, data);
  }
}
