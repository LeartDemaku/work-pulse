
import dbWrapper from '../database.js';

const medicalJobs = [
    {
        title: 'Mjek i Përgjithshëm',
        company: 'QKUK',
        location: 'Prishtinë',
        positions: 2,
        is_new: 1,
        description: 'Kërkohet mjek i përgjithshëm me licencë të rregullt pune.'
    },
    {
        title: 'Infermier/e',
        company: 'Spitali Amerikan',
        location: 'Prishtinë',
        positions: 5,
        is_new: 1,
        description: 'Infermier/e me eksperiencë në kujdesin intensiv.'
    },
    {
        title: 'Farmacist/e',
        company: 'Barnatore Agimi',
        location: 'Ferizaj',
        positions: 1,
        is_new: 0,
        description: 'Farmacist/e me licencë.'
    },
    {
        title: 'Laborant Mjekësor',
        company: 'Laboratori Avicena',
        location: 'Prizren',
        positions: 2,
        is_new: 1,
        description: 'Laborant për analiza biokimike.'
    },
    {
        title: 'Dentist/e',
        company: 'Klinika Dentare',
        location: 'Pejë',
        positions: 1,
        is_new: 0,
        description: 'Dentist me përvojë pune.'
    }
];

const educationJobs = [
    {
        title: 'Mësues/e i/e Matematikës',
        company: 'Shkolla "Fan Noli"',
        location: 'Podujevë',
        positions: 1,
        is_new: 1,
        description: 'Mësues i matematikës për ciklin e ulët.'
    },
    {
        title: 'Profesor i Gjuhës Angleze',
        company: 'Kolegji AAB',
        location: 'Prishtinë',
        positions: 2,
        is_new: 1,
        description: 'Profesor për gjuhën angleze akademike.'
    },
    {
        title: 'Edukatore Kopshti',
        company: 'Kopshti "Bleta"',
        location: 'Gjakovë',
        positions: 3,
        is_new: 1,
        description: 'Edukatore për grupmoshat 3-5 vjeç.'
    },
    {
        title: 'Asistent Administrativ në Shkollë',
        company: 'Shkolla "Gjon Buzuku"',
        location: 'Prizren',
        positions: 1,
        is_new: 0,
        description: 'Asistent për mbarëvajtjen administrative të shkollës.'
    },
    {
        title: 'Trajner IT',
        company: 'Qendra e Trajnimeve',
        location: 'Prishtinë',
        positions: 2,
        is_new: 1,
        description: 'Trajner për kurset bazike të IT-së.'
    }
];

async function addJobs() {
    console.log('Initializing database...');
    // We need to call init first to load the DB
    if (dbWrapper.init) {
        await dbWrapper.init();
    }

    console.log('Adding Medical Jobs...');
    for (const job of medicalJobs) {
        dbWrapper.execute(
            'INSERT INTO jobs (title, company, location, positions, is_new, description) VALUES (?, ?, ?, ?, ?, ?)',
            [job.title, job.company, job.location, job.positions, job.is_new, job.description]
        );
    }

    console.log('Adding Education Jobs...');
    for (const job of educationJobs) {
        dbWrapper.execute(
            'INSERT INTO jobs (title, company, location, positions, is_new, description) VALUES (?, ?, ?, ?, ?, ?)',
            [job.title, job.company, job.location, job.positions, job.is_new, job.description]
        );
    }

    console.log('All jobs added successfully!');

    // Force save if needed, although insert usually saves.
    // However, database.js saves on process exit.
}

addJobs().catch(console.error);
