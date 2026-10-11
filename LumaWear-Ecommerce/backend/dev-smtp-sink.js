/**
 * dev-smtp-sink.js
 *
 * Minimal, dependency-free local SMTP sink for development and test runs.
 *
 * It speaks just enough SMTP for nodemailer to complete a LIVE dispatch:
 *   EHLO/HELO, AUTH PLAIN / AUTH LOGIN (accepts any credentials), MAIL FROM,
 *   RCPT TO, DATA, RSET, NOOP, QUIT. Messages are counted and logged but never
 *   relayed anywhere, so no real inbox is touched.
 *
 * This lets the suite exercise the full live email code path (transport connect,
 * auth, transmission, provider message id, telemetry) deterministically without
 * requiring real Gmail app-passwords.
 *
 * Usage:
 *   node dev-smtp-sink.js                 # listens on 127.0.0.1:2525
 *   SMTP_SINK_PORT=2526 node dev-smtp-sink.js
 *
 * Start it before `npm test` or the dev server when backend/.env points
 * SMTP_HOST/SMTP_PORT at this sink.
 */
import net from "node:net";

const PORT = Number(process.env.SMTP_SINK_PORT || 2525);
const HOST = process.env.SMTP_SINK_HOST || "127.0.0.1";

let receivedCount = 0;

const server = net.createServer((socket) => {
  const peer = `${socket.remoteAddress}:${socket.remotePort}`;
  let buffer = "";
  let inData = false;
  let dataBuffer = "";
  let authState = null; // null | "plain-wait" | "login-user" | "login-pass"

  const send = (line) => socket.write(`${line}\r\n`);

  send("220 lumawear-dev-smtp ESMTP ready");

  socket.on("data", (chunk) => {
    buffer += chunk.toString("utf8");

    // In DATA mode raw message bytes (terminated by <CRLF>.<CRLF>) may arrive
    // without being line-oriented, so handle the terminator first.
    if (inData) {
      dataBuffer += buffer;
      buffer = "";
      const endIdx = dataBuffer.indexOf("\r\n.\r\n");
      if (endIdx === -1) return;
      const message = dataBuffer.slice(0, endIdx);
      dataBuffer = "";
      inData = false;
      receivedCount++;
      const subjectMatch = message.match(/^Subject: (.*)$/mi);
      console.log(
        `[SMTP SINK] #${receivedCount} captured message from ${peer}` +
          (subjectMatch ? ` | Subject: ${subjectMatch[1].trim()}` : "") +
          ` | Bytes: ${message.length}`
      );
      send("250 2.0.0 Ok: queued");
      return;
    }

    let newlineIdx;
    while ((newlineIdx = buffer.indexOf("\r\n")) !== -1) {
      const line = buffer.slice(0, newlineIdx);
      buffer = buffer.slice(newlineIdx + 2);
      handleLine(line);
    }
  });

  function handleLine(line) {
    const upper = line.toUpperCase();

    // Finish AUTH challenges that expect a bare base64 payload next.
    if (authState === "plain-wait") {
      authState = null;
      send("235 2.7.0 Authentication successful");
      return;
    }
    if (authState === "login-user") {
      authState = "login-pass";
      send("334 UGFzc3dvcmQ6"); // "Password:"
      return;
    }
    if (authState === "login-pass") {
      authState = null;
      send("235 2.7.0 Authentication successful");
      return;
    }

    if (upper.startsWith("EHLO")) {
      socket.write(
        "250-lumawear-dev-smtp\r\n" +
          "250-8BITMIME\r\n" +
          "250-SIZE 10485760\r\n" +
          "250-AUTH PLAIN LOGIN\r\n" +
          "250 HELP\r\n"
      );
      return;
    }
    if (upper.startsWith("HELO")) {
      send("250 lumawear-dev-smtp");
      return;
    }
    if (upper.startsWith("AUTH PLAIN")) {
      const parts = line.split(" ");
      if (parts.length >= 3) {
        send("235 2.7.0 Authentication successful");
      } else {
        authState = "plain-wait";
        send("334 ");
      }
      return;
    }
    if (upper.startsWith("AUTH LOGIN")) {
      authState = "login-user";
      send("334 VXNlcm5hbWU6"); // "Username:"
      return;
    }
    if (upper.startsWith("MAIL FROM") || upper.startsWith("MAIL FROM:")) {
      send("250 2.1.0 Ok");
      return;
    }
    if (upper.startsWith("RCPT TO")) {
      send("250 2.1.5 Ok");
      return;
    }
    if (upper === "DATA") {
      inData = true;
      dataBuffer = "";
      send("354 End data with <CR><LF>.<CR><LF>");
      return;
    }
    if (upper === "RSET") {
      inData = false;
      dataBuffer = "";
      authState = null;
      send("250 2.0.0 Ok");
      return;
    }
    if (upper === "NOOP") {
      send("250 2.0.0 Ok");
      return;
    }
    if (upper === "QUIT") {
      send("221 2.0.0 Bye");
      socket.end();
      return;
    }
    if (upper.startsWith("STARTTLS")) {
      // Never advertised — refuse defensively so clients stay in plaintext.
      send("454 4.7.0 TLS not available");
      return;
    }
    send("500 5.5.2 Error: command not recognized");
  }

  socket.on("error", () => {
    // Client resets are expected when tests finish.
  });
});

server.listen(PORT, HOST, () => {
  console.log(`[SMTP SINK] Listening on ${HOST}:${PORT} (no mail will leave this machine)`);
});

server.on("error", (err) => {
  console.error(`[SMTP SINK] Failed to start on ${HOST}:${PORT}: ${err.message}`);
  process.exit(1);
});
