const http = require('http');

const BASE = 'http://localhost:5000/api';

function request(method, path, body, token) {
    return new Promise((resolve, reject) => {
        const url = new URL(BASE + path);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname,
            method,
            headers: { 'Content-Type': 'application/json' }
        };
        if (token) options.headers['Authorization'] = `Bearer ${token}`;

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', d => data += d);
            res.on('end', () => {
                try { resolve({ status: res.statusCode, data: JSON.parse(data) }); }
                catch { resolve({ status: res.statusCode, data }); }
            });
        });
        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function main() {
    // 1) Register mentor
    console.log('--- Registering Mentor ---');
    let r = await request('POST', '/auth/register', {
        name: 'Dr. Sarah Mitchell', email: 'sarah.mentor@demo.com', password: 'demo123456', role: 'mentor'
    });
    let mentorToken;
    if (r.status === 201 || r.status === 200) {
        mentorToken = r.data.token;
        console.log('Mentor registered:', r.data.user?.name || r.data.name);
    } else {
        console.log('Mentor register response:', r.status, r.data.message || r.data);
        // Try login instead
        console.log('Trying login...');
        r = await request('POST', '/auth/login', { email: 'sarah.mentor@demo.com', password: 'demo123456' });
        if (r.data.token) {
            mentorToken = r.data.token;
            console.log('Mentor logged in:', r.data.user?.name);
        } else {
            console.log('Login failed:', r.data);
            return;
        }
    }

    // 2) Create programs
    console.log('\n--- Creating Programs ---');
    const programs = [
        {
            title: 'Backend Engineering with Node.js',
            description: 'Master backend development with Node.js, Express, and MongoDB. Build production-ready REST APIs from scratch, learn database design, authentication, and deployment strategies.',
            skillsCovered: ['Node.js', 'Express', 'MongoDB', 'REST APIs', 'JWT Auth'],
            duration: '6 weeks',
            level: 'Intermediate',
            format: 'Group',
            maxMentees: 8,
            prerequisites: 'Basic JavaScript knowledge and familiarity with HTML/CSS',
            outcomes: ['Build production-ready REST APIs', 'Design MongoDB schemas', 'Implement JWT authentication', 'Deploy to cloud platforms'],
            status: 'published'
        },
        {
            title: 'React & Modern Frontend Development',
            description: 'Learn React from the ground up. Covers hooks, state management, routing, API integration, and responsive design patterns used by top companies.',
            skillsCovered: ['React', 'JavaScript ES6+', 'CSS3', 'React Router', 'State Management'],
            duration: '8 weeks',
            level: 'Beginner',
            format: '1:1',
            maxMentees: 3,
            prerequisites: 'Basic HTML, CSS, and JavaScript',
            outcomes: ['Build complete React applications', 'Master React Hooks and Context', 'Create responsive UIs', 'Integrate with REST APIs'],
            status: 'published'
        },
        {
            title: 'System Design for Interviews',
            description: 'Prepare for system design interviews at top tech companies. Cover distributed systems, scalability patterns, load balancing, caching, and real-world architecture case studies.',
            skillsCovered: ['System Design', 'Distributed Systems', 'Scalability', 'Databases', 'Caching'],
            duration: '4 weeks',
            level: 'Advanced',
            format: 'Group',
            maxMentees: 10,
            prerequisites: 'At least 2 years of software development experience',
            outcomes: ['Design scalable systems', 'Ace system design interviews', 'Understand trade-offs in architecture', 'Draw clear system diagrams'],
            status: 'published'
        }
    ];

    for (const p of programs) {
        const res = await request('POST', '/programs', p, mentorToken);
        console.log(`  "${p.title}" -> ${res.status} (${res.data.status || res.data.message})`);
    }

    // 3) Register student
    console.log('\n--- Registering Student ---');
    r = await request('POST', '/auth/register', {
        name: 'Alex Johnson', email: 'alex.student@demo.com', password: 'demo123456', role: 'student'
    });
    let studentToken;
    if (r.status === 201 || r.status === 200) {
        studentToken = r.data.token;
        console.log('Student registered:', r.data.user?.name || r.data.name);
    } else {
        console.log('Student register response:', r.status, r.data.message || r.data);
        r = await request('POST', '/auth/login', { email: 'alex.student@demo.com', password: 'demo123456' });
        if (r.data.token) {
            studentToken = r.data.token;
            console.log('Student logged in:', r.data.user?.name);
        } else {
            console.log('Login failed:', r.data);
            return;
        }
    }

    // 4) Browse published programs
    console.log('\n--- Browsing Marketplace ---');
    r = await request('GET', '/programs', null, studentToken);
    console.log(`Found ${r.data.length} published programs`);

    if (r.data.length > 0) {
        const targetProgram = r.data[0];
        console.log(`\n--- Applying to "${targetProgram.title}" ---`);
        const applyRes = await request('POST', `/programs/${targetProgram._id}/apply`, {
            message: 'I am very eager to learn this topic and have been studying on my own for a few months!'
        }, studentToken);
        console.log(`  Apply result: ${applyRes.status} (${applyRes.data.status || applyRes.data.message})`);
    }

    console.log('\n✅ Demo data created successfully!');
    console.log('Mentor login: sarah.mentor@demo.com / demo123456');
    console.log('Student login: alex.student@demo.com / demo123456');
}

main().catch(console.error);
