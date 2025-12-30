import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import { convert } from 'html-to-text';

interface FetchResult {
  emails: { content: string; date: Date; uid: number }[];
  lastUid: number;
}

export const fetchEmailsIncrementally = async (
  email: string,
  appPassword: string,
  fromEmail: string,
  lastUid: number = 0,
  limit: number = 5
): Promise<FetchResult> => {
  const client = new ImapFlow({
    host: 'imap.gmail.com',
    port: 993,
    secure: true,
    auth: {
      user: email,
      pass: appPassword,
    },
    logger: false,
  });

  const emails: { content: string; date: Date; uid: number }[] = [];
  let newLastUid = lastUid;

  try {
    await client.connect();
    const lock = await client.getMailboxLock('INBOX');

    try {
      // Search for emails from the specified sender
      const searchCriteria: any = { from: fromEmail };
      if (lastUid > 0) {
        searchCriteria.uid = `${lastUid + 1}:*`;
      }

      const messages = await client.search(searchCriteria);
      
      // search returns sequence numbers.
      let targetSeqs: number[] = Array.isArray(messages) ? messages : [];
      
      // If we are starting fresh (lastUid === 0), we only want the latest 'limit' emails
      if (lastUid === 0 && targetSeqs.length > limit) {
        targetSeqs = targetSeqs.slice(-limit);
      }

      if (targetSeqs.length > 0) {
        for (const seq of targetSeqs) {
          // Fetch by sequence number
          const message = await client.fetchOne(seq.toString(), { source: true, uid: true, envelope: true });
          if (message && message.source) {
            const parsed = await simpleParser(message.source);
            
            let content = '';
            if (parsed.text) {
              content = parsed.text;
            } else if (parsed.html) {
              // Convert HTML to text if no plain text version exists
              content = convert(parsed.html as string, {
                wordwrap: false,
                selectors: [
                  { selector: 'a', options: { ignoreHref: true } },
                  { selector: 'img', format: 'skip' }
                ]
              });
            } else if (parsed.textAsHtml) {
              content = convert(parsed.textAsHtml as string, { wordwrap: false });
            }

            const date = message.envelope?.date || parsed.date || new Date();
            
            if (content) {
              emails.push({ 
                content: content.trim(), 
                date, 
                uid: message.uid 
              });
            }
            // Use the actual UID from the message for tracking
            if (message.uid && message.uid > newLastUid) {
              newLastUid = message.uid;
            }
          }
        }
      }
    } finally {
      lock.release();
    }

    await client.logout();
  } catch (error) {
    console.error(`IMAP error for ${email}:`, error);
    try {
      await client.logout();
    } catch (e) {}
    throw error;
  }

  return { emails, lastUid: newLastUid };
};

export const fetchSampleEmails = async (
  email: string,
  appPassword: string,
  fromEmail: string,
  limit: number = 5
): Promise<string[]> => {
  const { emails } = await fetchEmailsIncrementally(email, appPassword, fromEmail, 0, limit);
  return emails.map(e => e.content);
};
