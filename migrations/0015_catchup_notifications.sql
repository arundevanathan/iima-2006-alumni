-- Persist catch-up requests and acceptance events for roster members, including before first sign-in.
-- Preserve every existing notification ID, timestamp, read flag and sample flag while expanding supported kinds.
DROP TRIGGER IF EXISTS notify_like;
DROP TRIGGER IF EXISTS notify_comment;
DROP TRIGGER IF EXISTS notify_accepted_mention;
DROP TRIGGER IF EXISTS notify_updated_mention;
DROP TRIGGER IF EXISTS notify_about;
DROP TRIGGER IF EXISTS notify_photo;
CREATE TABLE notifications_next (
 id INTEGER PRIMARY KEY,
 recipient INTEGER NOT NULL REFERENCES roster(id),
 actor INTEGER REFERENCES roster(id),
 kind TEXT NOT NULL CHECK(kind IN ('mention','like','comment','tag','catchup_request','catchup_accepted')),
 post TEXT REFERENCES posts(id),
 anchor TEXT NOT NULL DEFAULT '',
 event_key TEXT NOT NULL,
 created INTEGER NOT NULL DEFAULT (unixepoch()),
 is_read INTEGER NOT NULL DEFAULT 0,
 sample INTEGER NOT NULL DEFAULT 0,
 UNIQUE(recipient,event_key)
);
INSERT INTO notifications_next SELECT * FROM notifications;
DROP TABLE notifications;
ALTER TABLE notifications_next RENAME TO notifications;
CREATE INDEX notification_inbox ON notifications(recipient,is_read,id);

ALTER TABLE meet_wishes ADD COLUMN request_id TEXT NOT NULL DEFAULT '';
ALTER TABLE meet_wishes ADD COLUMN accepted_at INTEGER;
UPDATE meet_wishes SET request_id=lower(hex(randomblob(16))) WHERE request_id='';
CREATE UNIQUE INDEX meet_wishes_request_id ON meet_wishes(request_id);

CREATE TRIGGER IF NOT EXISTS notify_like AFTER INSERT ON likes
WHEN 1
BEGIN
 INSERT OR IGNORE INTO notifications(recipient,actor,kind,post,anchor,event_key)
 SELECT p.author,NEW.member,'like',p.id,'','like:'||NEW.post||':'||NEW.member
 FROM posts p WHERE p.id=NEW.post AND p.author<>NEW.member;
END;

CREATE TRIGGER IF NOT EXISTS notify_comment AFTER INSERT ON comments
WHEN NEW.hidden=0
BEGIN
 INSERT OR IGNORE INTO notifications(recipient,actor,kind,post,anchor,event_key)
 SELECT p.author,NEW.author,'comment',p.id,'comment-'||NEW.id,'comment:'||NEW.id
 FROM posts p WHERE p.id=NEW.post AND p.author<>NEW.author;
END;

CREATE TRIGGER IF NOT EXISTS notify_accepted_mention AFTER INSERT ON tags
WHEN NEW.status='accepted' AND (SELECT actor FROM notification_tag_actor WHERE post=NEW.post) IS NOT NULL
BEGIN
 INSERT OR IGNORE INTO notifications(recipient,actor,kind,post,anchor,event_key)
 SELECT r.id,(SELECT actor FROM notification_tag_actor WHERE post=NEW.post),'mention',NEW.post,'','mention:'||NEW.post||':'||''
 FROM roster r WHERE 1 AND r.id=NEW.member AND r.id<>(SELECT actor FROM notification_tag_actor WHERE post=NEW.post);
 INSERT OR IGNORE INTO notifications(recipient,actor,kind,post,anchor,event_key)
 SELECT p.author,(SELECT actor FROM notification_tag_actor WHERE post=NEW.post),'tag',p.id,'','person:'||NEW.post||':'||NEW.member
 FROM posts p WHERE p.id=NEW.post AND p.author<>(SELECT actor FROM notification_tag_actor WHERE post=NEW.post);
END;

CREATE TRIGGER IF NOT EXISTS notify_updated_mention AFTER UPDATE OF status ON tags
WHEN NEW.status='accepted' AND OLD.status='pending' AND (SELECT actor FROM notification_tag_actor WHERE post=NEW.post) IS NOT NULL
BEGIN
 INSERT OR IGNORE INTO notifications(recipient,actor,kind,post,anchor,event_key)
 SELECT r.id,(SELECT actor FROM notification_tag_actor WHERE post=NEW.post),'mention',NEW.post,'','mention:'||NEW.post||':'||''
 FROM roster r WHERE 1 AND r.id=NEW.member AND r.id<>(SELECT actor FROM notification_tag_actor WHERE post=NEW.post);
 INSERT OR IGNORE INTO notifications(recipient,actor,kind,post,anchor,event_key)
 SELECT p.author,(SELECT actor FROM notification_tag_actor WHERE post=NEW.post),'tag',p.id,'','person:'||NEW.post||':'||NEW.member
 FROM posts p WHERE p.id=NEW.post AND p.author<>(SELECT actor FROM notification_tag_actor WHERE post=NEW.post);
END;

CREATE TRIGGER IF NOT EXISTS notify_about AFTER INSERT ON memory_about
WHEN NEW.kind IN ('person','topic')
BEGIN
 INSERT OR IGNORE INTO notifications(recipient,actor,kind,post,anchor,event_key)
 SELECT r.id,coalesce((SELECT actor FROM notification_tag_actor WHERE post=NEW.post),(SELECT author FROM posts WHERE id=NEW.post)),'mention',NEW.post,'','mention:'||NEW.post||':'||''
 FROM roster r WHERE NEW.kind='person' AND r.id=CAST(NEW.target AS INTEGER) AND r.id<>coalesce((SELECT actor FROM notification_tag_actor WHERE post=NEW.post),(SELECT author FROM posts WHERE id=NEW.post));
 INSERT OR IGNORE INTO notifications(recipient,actor,kind,post,anchor,event_key)
 SELECT p.author,coalesce((SELECT actor FROM notification_tag_actor WHERE post=NEW.post),(SELECT author FROM posts WHERE id=NEW.post)),'tag',p.id,'','about:'||NEW.post||':'||''||':'||NEW.kind||':'||NEW.target
 FROM posts p WHERE p.id=NEW.post AND p.author<>coalesce((SELECT actor FROM notification_tag_actor WHERE post=NEW.post),(SELECT author FROM posts WHERE id=NEW.post));
END;

CREATE TRIGGER IF NOT EXISTS notify_photo AFTER INSERT ON photo_tags
WHEN NEW.kind IN ('person','topic')
BEGIN
 INSERT OR IGNORE INTO notifications(recipient,actor,kind,post,anchor,event_key)
 SELECT r.id,coalesce((SELECT actor FROM notification_tag_actor WHERE post=NEW.post),(SELECT author FROM posts WHERE id=NEW.post)),'mention',NEW.post,'photo-'||replace(NEW.media,'/','-'),'mention:'||NEW.post||':'||'photo-'||replace(NEW.media,'/','-')
 FROM roster r WHERE NEW.kind='person' AND r.id=CAST(NEW.target AS INTEGER) AND r.id<>coalesce((SELECT actor FROM notification_tag_actor WHERE post=NEW.post),(SELECT author FROM posts WHERE id=NEW.post));
 INSERT OR IGNORE INTO notifications(recipient,actor,kind,post,anchor,event_key)
 SELECT p.author,coalesce((SELECT actor FROM notification_tag_actor WHERE post=NEW.post),(SELECT author FROM posts WHERE id=NEW.post)),'tag',p.id,'photo-'||replace(NEW.media,'/','-'),'photo:'||NEW.post||':'||'photo-'||replace(NEW.media,'/','-')||':'||NEW.kind||':'||NEW.target
 FROM posts p WHERE p.id=NEW.post AND p.author<>coalesce((SELECT actor FROM notification_tag_actor WHERE post=NEW.post),(SELECT author FROM posts WHERE id=NEW.post));
END;

CREATE TRIGGER notify_catchup_request AFTER INSERT ON meet_wishes
BEGIN
 UPDATE meet_wishes SET request_id=lower(hex(randomblob(16)))
 WHERE member=NEW.member AND target=NEW.target AND request_id='';
 INSERT OR IGNORE INTO notifications(recipient,actor,kind,anchor,event_key,created)
 SELECT w.target,w.member,'catchup_request',w.request_id,'catchup-request:'||w.request_id,w.created/1000
 FROM meet_wishes w WHERE w.member=NEW.member AND w.target=NEW.target;
END;

CREATE TRIGGER notify_catchup_accepted AFTER UPDATE OF accepted_at ON meet_wishes
WHEN OLD.accepted_at IS NULL AND NEW.accepted_at IS NOT NULL
BEGIN
 INSERT OR IGNORE INTO notifications(recipient,actor,kind,anchor,event_key,created)
 VALUES(NEW.member,NEW.target,'catchup_accepted',NEW.request_id,'catchup-accepted:'||NEW.request_id,NEW.accepted_at/1000);
 UPDATE notifications SET is_read=1
 WHERE recipient=NEW.target AND kind='catchup_request' AND anchor=NEW.request_id;
END;

-- Existing picks become actionable requests. No member account or sign-in is needed to receive an event.
INSERT OR IGNORE INTO notifications(recipient,actor,kind,anchor,event_key,created)
 SELECT target,member,'catchup_request',request_id,'catchup-request:'||request_id,created/1000 FROM meet_wishes;
