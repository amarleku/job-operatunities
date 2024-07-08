const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const app = express();
const port = 3000;

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

      jobs.push({ title, company, location, deadline });
    });

    return jobs;
  } catch (error) {
    console.error('Error fetching job data:', error);
    return [];
  }
};

app.get('/jobs', async (req, res) => {
  const jobs = await scrapeJobs();
  res.json(jobs);
  console.log('Jobs fetched:', jobs);
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
