# H&M scraper.
Welcome to the H&M scraper, this API allows you to access the different resources of H&M website, enabling you to retrieve information about products and saving them into a database

## Installation
As per sqlite is used as the database solution for this app, you can find the database associated within `prisma/prisma/dev.db`, this database already contains some sample data to serve your app.

Steps to start the service:
1. Create your environment file by moving `.env.sample` file to `.env`, you don't need to change anything unless you want to serve on another port rather than the default `3000`, or in case you want to move the db file path.
```bash
mv .env.sample .env
```
2. Install the node modules needed to run the app by running this following command.
```bash
yarn install
```
3. Start the application by running the following command, and you'll find the application up and running on `localhost:3000`, test it by pinging `http://localhost:3000/api/categories` and it should display the list of categories api
```bash
yarn be:watch
```

1. Start scraping for products data by running the following command:
```bash
yarn be:scrape
```
_(Note: If you would like to change how many products are saved you can
change the ``pageSize`` constant in ``web-scraper/index.ts`` file just keep in mind that there's variants for each product and you can keep track how many products are saved in the console)_
