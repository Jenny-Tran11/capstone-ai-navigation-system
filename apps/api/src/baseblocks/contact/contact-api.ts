import type { ContactSubmission } from '@baseline/types/contact';
import type { Response } from 'express';
import { isAdmin } from '../../middleware/is-admin';
import createAuthenticatedHandler from '../../util/create-authenticated-handler';
import { getErrorMessage } from '../../util/error-message';
import createApp from '../../util/express-app';
import type { RequestContext } from '../../util/request-context.type';
import { ContactMapper } from './contact';
import { contactService } from './contact.service';

const app = createApp();

export const handler = createAuthenticatedHandler(app);
export { app };

app.post('/contact', [
  async (req: RequestContext, res: Response) => {
    try {
      const { name, email, message } = req.body as Partial<ContactSubmission>;

      if (!name || !email || !message) {
        res
          .status(400)
          .json({ error: 'Name, email, and message are required' });
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        res.status(400).json({ error: 'Invalid email address' });
        return;
      }

      const submission = await contactService.create({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        message: message.trim(),
        createdAt: new Date().toISOString(),
      });

      res.status(201).json(ContactMapper(submission));
    } catch (error) {
      const message = getErrorMessage(error);
      console.error(`Failed to save contact submission: ${message}`);
      res
        .status(500)
        .json({ error: 'Failed to send message, please try again' });
    }
  },
]);

app.get('/contact/list', [
  isAdmin,
  async (_req: RequestContext, res: Response) => {
    try {
      const submissions = await contactService.getAll();
      const formatted = submissions.map((s) => ContactMapper(s));
      res.json(formatted);
    } catch (error) {
      const message = getErrorMessage(error);
      console.error(`Failed to get contact submissions: ${message}`);
      res.status(500).json({ error: 'Failed to retrieve submissions' });
    }
  },
]);
