"""
--> this code takes use of URLFetcher.py and fetches the text data from each of the pages
--> saves it in a .txt file
--> voila!!
"""

import os
import json
os.chdir('D:/Machine Learning/SLM-Project/')

query_file = 'Data Collection/webscrapper/search_queries.json'
out_file = f'Data/webscrapped data/britannica_output.txt'
max_limit = 10

with open(query_file, 'r') as file:
  search_queries = json.load(file)

from tqdm import tqdm

from URLFetcher import BritannicaUrls
scrape = BritannicaUrls(search_queries=search_queries, max_limit=10)
with tqdm(total=len(search_queries) * max_limit, desc="Generating URL snippets: ") as pbar:
  url_snippets = scrape.generate_urls(progress_bar=pbar)

print('fetched snippets successfully!')
print(f"total snippets: {len(url_snippets)}")

import requests
from bs4 import BeautifulSoup
import re

def text_extractor(url_snippet):
  target_url = f"https://britannica.com{url_snippet}"
  r = requests.get(target_url, headers=scrape.headers)

  if r.status_code == 200:
    soup = BeautifulSoup(r.content, 'html.parser')
    paragraphs = soup.find_all('p')
    
    # extract text content from each <p> tag, excluding specified text
    page = '\n'.join([p.get_text() for p in paragraphs if "Our editors will review what you’ve submitted and determine whether to revise the article." not in p.get_text()])
    page = re.sub('&\w+;','',page)

    return page

if __name__ == '__main__':
  with tqdm(total=len(url_snippets), desc="Scrapping in progress: ") as pbar:
    for snippets in url_snippets:
      page = text_extractor(snippets)
      with open(out_file, 'a', encoding='utf-8') as file:
        file.write(page)
      pbar.update(1)