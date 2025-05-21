const express = require('express');
const axios = require('axios');
const cors = require('cors');
const { JSDOM } = require('jsdom');
const path = require('path');
require('dotenv').config();
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

/**
 * Formats job posting text into a prompt for an LLM to parse
 * @param {string} jobPostingText - The raw text of the job posting
 * @returns {string} A formatted prompt for the LLM
 */
function createJobPostingPrompt(jobPostingText) {
    return `Please analyze this job posting and extract the following information in valid JSON format:
{
    "company": "company name",
    "title": "job title",
    "location": "job location",
    "description": "summarize the job description in one to two sentences",
    "salary": "salary information if available, just a number or range"
}

Job Posting:
${jobPostingText}

Please provide only the valid JSON response, no additional text. Also ensure that the salary value is a string and not a raw integer or range`;
}

/**
 * Extracts text content from HTML using jsdom
 * @param {string} html - The HTML content
 * @returns {string} The extracted text content
 */
function extractTextFromHTML(html) {
    html = String(html); // Ensure html is a string
    const dom = new JSDOM(html);
    const document = dom.window.document;
    
    // Remove script and style elements
    const scripts = document.getElementsByTagName('script');
    const styles = document.getElementsByTagName('style');
    Array.from(scripts).forEach(script => script.remove());
    Array.from(styles).forEach(style => style.remove());

    // Try to find the main job description content
    let content = '';
    
    // LinkedIn specific selectors
    const linkedinSelectors = [
        'div.jobs-description__content', // Main job description
        'div.jobs-description-content__text', // Alternative job description
        'div.jobs-box__html-content', // Another possible job description container
        'div.jobs-unified-top-card__primary-description', // Job title and company info
        'div.jobs-unified-top-card__subtitle-primary-grouping' // Location and other details
    ];

    // Check if it's a LinkedIn page
    const isLinkedIn = html.includes('linkedin.com/jobs');
    
    if (isLinkedIn) {
        // Try each LinkedIn selector
        for (const selector of linkedinSelectors) {
            const element = document.querySelector(selector);
            if (element) {
                content += element.textContent.trim() + '\n\n';
            }
        }
    }

    // If no LinkedIn content was found or it's not LinkedIn, try general selectors
    if (!content) {
        const generalSelectors = [
            'main',
            'article',
            'div[role="main"]',
            'div.content',
            'div.main-content',
            'div.job-description',
            'div.description'
        ];

        for (const selector of generalSelectors) {
            const element = document.querySelector(selector);
            if (element) {
                content += element.textContent.trim() + '\n\n';
            }
        }
    }

    // If still no content found, fall back to body
    if (!content) {
        content = document.body.textContent;
    }

    // Clean up the content
    content = content
        .replace(/\s+/g, ' ') // Replace multiple spaces with single space
        .replace(/\n+/g, '\n') // Replace multiple newlines with single newline
        .trim();

    // Limit the content length to avoid token limits
    const MAX_LENGTH = 8000; // Adjust this based on your needs
    if (content.length > MAX_LENGTH) {
        content = content.substring(0, MAX_LENGTH) + '...';
    }

    return content;
}

app.post('/parse-job', async (req, res) => {
    try {
        const { url, content } = req.body;
        let jobContent;

        if (url) {
            // Fetch content from URL
            const response = await axios.get(url);
            jobContent = extractTextFromHTML(response.data);
        } else if (content) {
            jobContent = content;
        } else {
            throw new Error('Either URL or content must be provided');
        }

        // Create prompt
        const prompt = createJobPostingPrompt(jobContent);

        // Call Groq API
        const groqResponse = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
                model: 'llama3-8b-8192',
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.7,
                response_format: { "type": "json_object" }
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
                }
            }
        );

        const result = JSON.parse(groqResponse.data.choices[0].message.content);
        res.json(result);
    } catch (error) {
        console.error('Error making request:', error.response?.data || error.message);
      }
});

// Serve index.html at root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});