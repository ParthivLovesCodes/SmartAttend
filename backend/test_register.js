// A simple script to test if your backend creates users
const http = require('http');

const data = JSON.stringify({
    name: "Prof. Sharma",
    email: "sharma@adtu.in",
    password: "teachermode123",
    role: "teacher", // <--- KEY CHANGE
    department: "Computer Science"
});

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/register',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    
    res.on('data', (d) => {
        const response = JSON.parse(d.toString());
        if (res.statusCode === 200) {
            console.log("\n✅ SUCCESS! User Created.");
            console.log("Token Received:", response.token.substring(0, 20) + "...");
            console.log("User Details:", response.user);
        } else {
            console.log("\n❌ ERROR:", response.msg);
        }
    });
});

req.on('error', (error) => {
    console.error(error);
});

req.write(data);
req.end();