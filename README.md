# LockerBox AI

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

### Build and Start the Next.js App

First, build your Next.js project for production:

```bash
npm run build
```
Then, start the Next.js server:
```
npm run start
```
Run the Nginx Docker Container

To serve the built Next.js project using Nginx, run the following command:
```
docker run -d -p 80:80 -v $PWD/out:/usr/share/nginx/html/out -v $PWD/nginx/nginx.conf:/etc/nginx/nginx.conf:ro --name nginx-server nginx
```