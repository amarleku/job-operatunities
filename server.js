const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const app = express();
const port = 3000;

let jobStorage = [];

const generateId = () => {
  return `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
};

const scrapeJobs = async () => {
  try {
    const { data } = await axios.get('https://balfin.al/human-resources/career-opportunities/');
    const $ = cheerio.load(data);
    const jobs = [];

    $('div.content').each((index, element) => {
      const title = $(element).find('div.title.small').text().trim();
      const company = $(element).find('div.info:contains("Company") strong').text().trim();
      const location = $(element).find('div.info:contains("Location") strong').text().trim();
      const deadline = $(element).find('div.info:contains("Deadline") strong').text().trim();

      const existingJob = jobStorage.find(job => job.title === title && job.company === company);
      const id = existingJob ? existingJob.id : generateId();

      jobs.push({ id, title, company, location, deadline });
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
  jobStorage = jobStorage.filter(job => newJobs.find(newJob => newJob.id === job.id));
};

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
