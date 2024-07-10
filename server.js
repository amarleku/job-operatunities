const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');
const app = express();
const port = 3000;

let jobStorage = [];

const generateId = () => {
  return `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
};

const formatDate = (dateString) => {
  const [day, month, year] = dateString.split(' ');
  const monthMap = {
    Jan: '01',
    Feb: '02',
    Mar: '03',
    Apr: '04',
    May: '05',
    Jun: '06',
    Jul: '07',
    Aug: '08',
    Sep: '09',
    Oct: '10',
    Nov: '11',
    Dec: '12',
  };
  return `${day}-${monthMap[month]}-${year}`;
};

const scrapeJobs = async () => {
  try {
    const { data } = await axios.get('https://balfin.al/human-resources/career-opportunities/');
    const $ = cheerio.load(data);
    const jobs = [];

    $('div.content').each((index, element) => {
      const titleElement = $(element).find('a');
      const title = titleElement.find('div.title.small').text().trim();
      const link = titleElement.attr('href');
      const company = $(element).find('div.info:contains("Company") strong').text().trim();
      const location = $(element).find('div.info:contains("Location") strong').text().trim();
      const deadlineRaw = $(element).find('div.info:contains("Deadline") strong').text().trim();
      const deadline = formatDate(deadlineRaw);

      const existingJob = jobStorage.find(job => job.title === title && job.company === company);
      const id = existingJob ? existingJob.id : generateId();

      jobs.push({ id, title, link, company, location, deadline });
    });

    return jobs;
  } catch (error) {
    console.error('Error fetching job data:', error);
    return [];
  }
};

const updateJobStorage = async () => {
  const newJobs = await scrapeJobs();

  // Update the jobStorage by comparing it with newJobs
  jobStorage = newJobs.map(newJob => {
    const existingJob = jobStorage.find(job => job.title === newJob.title && job.company === newJob.company);
    return existingJob ? { ...newJob, id: existingJob.id } : newJob;
  });

  // Remove jobs that are no longer available
  jobStorage = jobStorage.filter(job => newJobs.find(newJob => newJob.title === job.title && newJob.company === job.company));
};

// Configure CORS to allow only a specific domain
const allowedOrigin = 'http://example.com';  // Replace with your allowed domain

app.use(cors({
  origin: (origin, callback) => {
    if (origin === allowedOrigin || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));

app.get('/jobs', async (req, res) => {
  await updateJobStorage();
  res.json(jobStorage);
});

app.get('/jobs/:id', async (req, res) => {
  await updateJobStorage();
  const job = jobStorage.find(job => job.id === req.params.id);
  if (job) {
    res.json(job);
  } else {
    res.status(404).send('Job not found');
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
