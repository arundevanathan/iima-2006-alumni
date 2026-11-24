-- Backfill real historical activity. Preserve existing read state and deduplicate against live-event keys.
INSERT OR IGNORE INTO notifications(recipient,actor,kind,post,anchor,event_key,created,is_read)
 SELECT p.author,l.member,'like',p.id,'','like:'||p.id||':'||l.member,p.created/1000,p.created<=coalesce(r.seen,0)
 FROM likes l JOIN posts p ON p.id=l.post LEFT JOIN notification_reads r ON r.member=p.author
 WHERE p.hidden=0 AND p.author<>l.member;

INSERT OR IGNORE INTO notifications(recipient,actor,kind,post,anchor,event_key,created,is_read)
 SELECT p.author,c.author,'comment',p.id,'comment-'||c.id,'comment:'||c.id,c.created/1000,c.created<=coalesce(r.seen,0)
 FROM comments c JOIN posts p ON p.id=c.post LEFT JOIN notification_reads r ON r.member=p.author
 WHERE c.hidden=0 AND p.hidden=0 AND c.author<>p.author;

INSERT OR IGNORE INTO notifications(recipient,actor,kind,post,anchor,event_key,created,is_read)
 SELECT p.subject,p.author,'mention',p.id,'','mention:'||p.id||':',p.created/1000,p.created<=coalesce(r.seen,0)
 FROM posts p JOIN roster recipient ON recipient.id=p.subject LEFT JOIN notification_reads r ON r.member=p.subject
 WHERE p.hidden=0 AND p.subject<>p.author;

-- The author of a historical tag edit is unknown; leave actor blank instead of attributing it incorrectly.
INSERT OR IGNORE INTO notifications(recipient,actor,kind,post,anchor,event_key,created,is_read)
 SELECT t.member,NULL,'mention',p.id,'','mention:'||p.id||':',p.created/1000,p.created<=coalesce(r.seen,0)
 FROM tags t JOIN posts p ON p.id=t.post LEFT JOIN notification_reads r ON r.member=t.member
 WHERE t.status='accepted' AND p.hidden=0 AND t.member<>p.author;

INSERT OR IGNORE INTO notifications(recipient,actor,kind,post,anchor,event_key,created,is_read)
 SELECT CAST(a.target AS INTEGER),NULL,'mention',p.id,'','mention:'||p.id||':',p.created/1000,p.created<=coalesce(r.seen,0)
 FROM memory_about a JOIN posts p ON p.id=a.post JOIN roster recipient ON recipient.id=CAST(a.target AS INTEGER)
 LEFT JOIN notification_reads r ON r.member=recipient.id
 WHERE a.kind='person' AND p.hidden=0 AND recipient.id<>p.author;

INSERT OR IGNORE INTO notifications(recipient,actor,kind,post,anchor,event_key,created,is_read)
 SELECT CAST(t.target AS INTEGER),NULL,'mention',p.id,'photo-'||replace(t.media,'/','-'),
 'mention:'||p.id||':photo-'||replace(t.media,'/','-'),p.created/1000,p.created<=coalesce(r.seen,0)
 FROM photo_tags t JOIN posts p ON p.id=t.post JOIN roster recipient ON recipient.id=CAST(t.target AS INTEGER)
 LEFT JOIN notification_reads r ON r.member=recipient.id
 WHERE t.kind='person' AND p.hidden=0 AND recipient.id<>p.author;
