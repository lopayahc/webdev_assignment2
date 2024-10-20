const axios = require("axios");
const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const app = express();
let logs = [];  // เก็บข้อมูล logs
const url =
  "https://script.googleusercontent.com/macros/echo?user_content_key=LNVFjOFyt7uVGdh9GjFmTtUjpJGAGcPqxfQ7ZlS0z0YXzN-q4VxyckLPNEpmfsakqX67xjIvt3R_upKHZrcA66yl7C3zdg7sm5_BxDlH2jW0nuo2oDemN9CCS2h10ox_1xSncGQajx_ryfhECjZEnOQwROx_Wq-O5wsPy5w5JUsdPdcpj8TWgjjVAuN4sDTiMrnThHKU7n7LmNcslGllO5_ldGegmAJuXjfvqC1tFaecv-CYmXuM6Nz9Jw9Md8uu&lib=M9_yccKOaZVEQaYjEvK1gClQlFAuFWsxN";
const url2 =
  "https://app-tracking.pockethost.io/api/collections/drone_logs/records";

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'config.html'));
});

app.get("/logs-page", (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'logs.html'));
});


app.get("/temp", (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'temp.html'));
});

  
app.use(express.json());  // Middleware สำหรับ parse JSON  


app.get("/configs/:id", async (req, res) => {
  const id = Number(req.params.id);
  console.log("Fetching drone with ID:", id);  // ตรวจสอบ ID
  try {
    const response = await axios.get(url);
    const data = response.data.data;

    const drone = data.find((d) => d.drone_id === id);

    if (!drone) {
      return res.status(404).send({ error: "drone_id not found" });
    }

    if (drone.max_speed == null) {
      drone.max_speed = 100;
    } else if (drone.max_speed > 110) {
      drone.max_speed = 110;
    }

    res.send({
      drone_id: drone.drone_id,
      drone_name: drone.drone_name,
      light: drone.light,
      max_speed: drone.max_speed,
      country: drone.country,
      population: drone.population,
    });
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).send("Error fetching data");
  }
});

app.get("/logs", (req, res) => {
  try {
    console.log("Sending logs:", logs);  // ตรวจสอบ logs ก่อนส่งกลับไป
    res.set("Cache-Control", "no-store");  // ป้องกันการใช้ cache
    res.json(logs);  // ส่งข้อมูล logs กลับไปในรูป JSON
  } catch (error) {
    console.error("Error fetching logs:", error);
    res.status(500).send("Error fetching data");
  }
});


app.get("/status/:id", async (req, res) => {
  try {
    const response = await axios.get(url);
    const data = response.data.data;
    const id = Number(req.params.id);

    const drone = data.find((d) => d.drone_id === id);

    if (!drone) {
      return res.status(404).send({ error: "drone_id not found" });
    }

    res.send({ condition: drone.condition });
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).send("Error fetching data");
  }
});

// POST /logs: รับข้อมูลจาก temp.html และบันทึกลงในตัวแปร logs
app.post("/logs", (req, res) => {
  try {
    const { drone_id, drone_name, country, celsius } = req.body;

    console.log("Received data:", { drone_id, drone_name, country, celsius });

    if (!drone_id || !drone_name || !country || !celsius) {
      return res.status(400).send("Missing required fields");
    }

    const logEntry = {
      drone_id: Number(drone_id),
      drone_name,
      country,
      celsius: Number(celsius),
      created: new Date().toISOString(),
    };

    logs.unshift(logEntry);  // เพิ่มข้อมูลใหม่ใน logs
    console.log("Current logs:", logs);  // ตรวจสอบข้อมูลที่ถูกบันทึก
    res.json({ message: "Temperature logged successfully!" });
  } catch (error) {
    console.error("Error handling data:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
