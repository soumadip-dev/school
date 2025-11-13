import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { ENV } from './config/env.config.js';
import auth_routes from './routes/user.routes.js';
import blog_routes from './routes/blog.routes.js';
import album_routes from './routes/album.routes.js';
import admin_routes from './routes/admin.routes.js';
import event_routes from './routes/event.routes.js';
import slider_routes from './routes/slider.routes.js';
import committee_routes from './routes/committee.routes.js';
import lecture_routes from './routes/lecture.routes.js';
import discussion_routes from './routes/discussion.routes.js';

const app = express();

//* Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: ENV.FRONTEND_URL,
    credentials: true,
  })
);
app.use(cookieParser());

//* Root Route
app.get('/', (req, res) => res.send('Hello from JZS backend'));

//* Routes
app.use('/api/user', auth_routes);
app.use('/api/admin', admin_routes);
app.use('/api/blog', blog_routes);
app.use('/api/album', album_routes);
app.use('/api/events', event_routes);
app.use('/api/slider', slider_routes);
app.use('/api/committee', committee_routes);
app.use('/api/lecture', lecture_routes);
app.use('/api/discussion', discussion_routes);


export default app;
