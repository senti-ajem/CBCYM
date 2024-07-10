import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import multer from "multer";
import path from "path";
import { fileURLToPath } from 'url';
import methodOverride from 'method-override';

const { Client } = pg;

const app = express();
const port = 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const feedbackClient = new Client({
  user: 'postgres',       
  host: 'localhost',      
  database: 'feedback',   
  password: '123456',     
  port: 5432,
});

const prayerClient = new Client({
  user: 'postgres',       
  host: 'localhost',      
  database: 'prayer',     
  password: '123456',     
  port: 5432,
});

const filesClient = new Client({
  user: 'postgres',       
  host: 'localhost',      
  database: 'files',      
  password: '123456',     
  port: 5432,
});

const feedsClient = new Client({
  user: 'postgres',       
  host: 'localhost',      
  database: 'feeds',      
  password: '123456',     
  port: 5432,
});

const adminClient = new Client({
  user: 'postgres',      
  host: 'localhost',      
  database: 'admin',      
  password: '123456',     
  port: 5432,
});

adminClient.connect()
  .then(() => console.log('Connected to PostgreSQL admin database'))
  .catch(err => console.error('Connection error', err.stack));

feedsClient.connect()
  .then(() => console.log('Connected to PostgreSQL feeds database'))
  .catch(err => console.error('Connection error', err.stack));

prayerClient.connect()
  .then(() => console.log('Connected to PostgreSQL prayer database'))
  .catch(err => console.error('Connection error', err.stack));

feedbackClient.connect()
  .then(() => console.log('Connected to PostgreSQL feedback database'))
  .catch(err => console.error('Connection error', err.stack));

filesClient.connect()
  .then(() => console.log('Connected to PostgreSQL files database'))
  .catch(err => console.error('Connection error', err.stack));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});

const store = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'program/');
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});

const upload = multer({ storage: storage });
const program = multer({ storage: store });

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/program', express.static(path.join(__dirname, 'program')));
app.use(methodOverride('_method'));
app.set('view engine', 'ejs');





app.get('/service', (req, res) => {
  const query = 'SELECT * FROM admin ORDER BY created_at DESC';
  adminClient.query(query, (err, result) => {
    if (err) {
      console.error('Error fetching file data', err.stack);
      res.status(500).send('Error fetching file data');
    } else {
      const admin = result.rows;
      res.render('service', { admin });
    }
  });
});

app.get('/service', (req, res) => {
  adminClient.query('SELECT * FROM admin ORDER BY id DESC', (err, result) => {
    if (err) {
      console.error('Error fetching file data', err.stack);
      res.status(500).send('Error fetching file data');
    } else {
      const files = result.rows;
      res.render('service', { files, message: null });
    }
  });
});


app.get("/", (req, res) => {
  res.render("index.ejs");
});


app.post('/prayer', (req, res) => {
  const { name, email, prayer } = req.body;

  const query = 'INSERT INTO prayer (name, email, prayer) VALUES ($1, $2, $3)';
  const values = [name, email, prayer];
  console.log('Received prayer points:', req.body);

  prayerClient.query(query, values, (err, result) => {
    if (err) {
      console.error('Error inserting prayer points', err.stack);
      res.status(500).send('Error saving prayer points');
    } else {
      console.log('Prayer points saved to database');
      res.render('prayer', { message: 'Thank you for your prayer points!' });
    }
  });
});

app.get('/prayer', (req, res) => {
  res.render('prayer', { message: null });
});





app.get('/upload-success', (req, res) => {
  filesClient.query('SELECT * FROM files ORDER BY created_at DESC', (err, result) => {
    if (err) {
      console.error('Error fetching file data', err.stack);
      res.status(500).send('Error fetching file data');
    } else {
      const files = result.rows;
      res.render('gallery', {files });
    }
  });
});


app.post('/upload', upload.single('file'), (req, res) => {
  const file = req.file;
  if (!file) {
    return res.status(400).send('No file uploaded.');
  }

  const query = 'INSERT INTO files (filename, path) VALUES ($1, $2)';
  const values = [file.originalname, file.path];

  filesClient.query(query, values, (err, result) => {
    if (err) {
      console.error('Error inserting file data', err.stack);
      return res.status(500).send('Error saving file information');
    } else {
      console.log('File information saved to database');
      res.redirect('/upload-success');
    }
  });
});



app.get('/files', (req, res) => {
  filesClient.query('SELECT * FROM files ORDER BY created_at DESC', (err, result) => {
    if (err) {
      console.error('Error fetching file data', err.stack);
      res.status(500).send('Error fetching file data');
    } else {
      const files = result.rows;
      res.render('gallery', { files });
    }
  });
});

app.get("/prayer", (req, res) => {
  res.render("prayer.ejs");
});

app.get("/service", (req, res) => {
  res.render("service.ejs");
});

app.get("/team", (req, res) => {
  res.render("team.ejs");
});

app.get("/about", (req, res) => {
  res.render("about.ejs");
});

app.get("/contact", (req, res) => {
  res.render("contact.ejs");
});

app.get("/admin", (req, res) => {
  res.render("password.ejs");
});





var userIsAuthorised = false;

function passwordCheck(req, res, next) {
  const password = req.body["password"];
  if (password === "ILoveCBCYM") {
    userIsAuthorised = true;
  }
  next();
}
app.use(passwordCheck);



app.post("/check", (req, res) => {
  if (userIsAuthorised) {
    res.render("admin.ejs", { message: null });
  } else {
    res.render("password.ejs");
  }
});

app.post('/program', program.single('file'), (req, res) => {
  const file = req.file;
  if (!file) {
    return res.render('admin', { message: 'No file uploaded.' });
  }

  const query = 'INSERT INTO admin (filename, path) VALUES ($1, $2)';
  const values = [file.originalname, file.path];

  adminClient.query(query, values, (err, result) => {
    if (err) {
      console.error('Error inserting file data', err.stack);
      return res.render('admin', { message: 'Error saving file information' });
    } else {
      console.log('File information saved to database');
      res.redirect('/service');
    }
  });
});
app.post('/feedback', (req, res) => {
  const { name, email, feedback } = req.body;

  const query = 'INSERT INTO feedback (name, email, feedback) VALUES ($1, $2, $3)';
  const values = [name, email, feedback];
  console.log('Received your feedback:', req.body);

  feedbackClient.query(query, values, (err, result) => {
    if (err) {
      console.error('Error inserting feedback', err.stack);
      res.render('feedback', { message: 'Error saving feedback' });
    } else {
      console.log('Feedback saved to database');
      res.render('feedback', { message: 'Thank you for your feedback!' });
    }
  });
});


app.get('/feedback', (req, res) => {
  res.render('feedback', { message: null });
});



app.get('/feeds', (req, res) => {
  feedsClient.query('SELECT * FROM feeds ORDER BY created_at DESC', (err, result) => {
    if (err) {
      console.error('Error fetching feeds data', err.stack);
      res.status(500).send('Error fetching feeds data');
    } else {
      const feedsData = result.rows;
      res.render('feeds', { feeds: feedsData });
    }
  });
});

app.post('/feeds', (req, res) => {
  const { name, content } = req.body;

  const query = 'INSERT INTO feeds (name, content) VALUES ($1, $2)';
  const values = [name, content];
  console.log('Received content:', req.body);

  feedsClient.query(query, values, (err, result) => {
    if (err) {
      console.error('Error inserting content', err.stack);
      res.status(500).json({ success: false, error: 'Error saving your content' });
    } else {
      console.log('Content saved to database');
      res.redirect('/feeds');
    }
  });
});

app.get("/edit-feeds/:id", (req, res) => {
  const feedsId = req.params.id;

  const query = 'SELECT * FROM feeds WHERE id = $1';
  const values = [feedsId];

  feedsClient.query(query, values, (err, result) => {
    if (err) {
      console.error('Error fetching content data', err.stack);
      res.status(500).send('Error fetching content data');
    } else {
      const feedsData = result.rows[0];

      res.render("edit-feeds", {
        feedsId: feedsId,
        existingName: feedsData.name,
        existingContent: feedsData.content
      });
    }
  });
});

app.post("/update-feeds/:id", (req, res) => {
  const feedsId = req.params.id;
  const updatedName = req.body.name;
  const updatedContent = req.body.content;

  const query = 'UPDATE feeds SET name = $1, content = $2 WHERE id = $3';
  const values = [updatedName, updatedContent, feedsId];

  feedsClient.query(query, values, (err, result) => {
    if (err) {
      console.error('Error updating content data', err.stack);
      res.status(500).send('Error updating content data');
    } else {
      res.redirect("/feeds");
    }
  });
});

app.delete('/delete-feeds/:id', (req, res) => {
  const feedsId = req.params.id;

  const query = 'DELETE FROM feeds WHERE id = $1';
  const values = [feedsId];

  feedsClient.query(query, values, (err, result) => {
    if (err) {
      console.error('Error deleting content', err.stack);
      res.status(500).json({ success: false, error: 'Error deleting content' });
    } else {
      console.log('Content deleted from database');
      res.redirect('/feeds');
    }
  });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
