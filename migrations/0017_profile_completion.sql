-- Database-side tracking also sees profile edits made through the live Worker.
CREATE TABLE IF NOT EXISTS profile_completion (
 member INTEGER PRIMARY KEY REFERENCES roster(id),
 completed_at INTEGER,
 observed_at INTEGER NOT NULL DEFAULT 0,
 observed_order INTEGER NOT NULL DEFAULT 0,
 basis TEXT NOT NULL DEFAULT 'recorded' CHECK(basis IN ('recorded','observed','baseline'))
);
CREATE VIEW IF NOT EXISTS completed_profiles_public AS
WITH ranked_profile AS (
  SELECT member,field,value,row_number() OVER (
    PARTITION BY member,field ORDER BY priority DESC) AS choice
  FROM selected_profile_fields WHERE pilot_only=0
), profile_values AS (
  SELECT member,
    max(CASE WHEN field='dorm' THEN value END) AS dorm,
    max(CASE WHEN field='nickname' THEN value END) AS nickname,
    max(CASE WHEN field='city' THEN value END) AS city,
    max(CASE WHEN field='life' THEN value END) AS life,
    max(CASE WHEN field='family' THEN value END) AS family
  FROM ranked_profile WHERE choice=1 GROUP BY member
), profile_photos AS (
  SELECT y.member,ph.slot FROM yearbook_public y,json_each(y.images) j
  JOIN photos ph ON ph.submission=json_extract(j.value,'$.submission')
    AND ph.object_key=json_extract(j.value,'$.key')
  WHERE ph.slot IN ('then','now')
  UNION ALL
  SELECT member,CASE field WHEN 'thenPhotoObject' THEN 'then' ELSE 'now' END
  FROM profile_fields WHERE field IN ('thenPhotoObject','nowPhotoObject') AND trim(value)<>''
), completed_profiles AS (
  SELECT r.id,p.city,p.life FROM roster r LEFT JOIN profile_values p ON p.member=r.id
  WHERE trim(coalesce(p.dorm,r.dorm))<>'' AND trim(coalesce(p.nickname,r.nickname))<>''
    AND trim(coalesce(p.city,''))<>'' AND trim(coalesce(p.life,''))<>''
    AND trim(coalesce(p.family,''))<>''
    AND EXISTS(SELECT 1 FROM profile_photos ph WHERE ph.member=r.id AND ph.slot='then')
    AND EXISTS(SELECT 1 FROM profile_photos ph WHERE ph.member=r.id AND ph.slot='now')
) SELECT * FROM completed_profiles;
-- Existing profiles have no recoverable completion timestamp.
INSERT OR IGNORE INTO profile_completion(member,basis)
 SELECT id,'baseline' FROM completed_profiles_public;
CREATE TRIGGER IF NOT EXISTS completion_profile_fields_insert AFTER INSERT ON profile_fields
BEGIN
 INSERT INTO profile_completion(member,completed_at,basis)
 SELECT id,CAST((julianday('now')-2440587.5)*86400000 AS INTEGER),'recorded'
 FROM completed_profiles_public WHERE id=NEW.member ON CONFLICT(member) DO NOTHING;
END;
CREATE TRIGGER IF NOT EXISTS completion_profile_fields_update AFTER UPDATE ON profile_fields
BEGIN
 INSERT INTO profile_completion(member,completed_at,basis)
 SELECT id,CAST((julianday('now')-2440587.5)*86400000 AS INTEGER),'recorded'
 FROM completed_profiles_public WHERE id=NEW.member ON CONFLICT(member) DO NOTHING;
END;
CREATE TRIGGER IF NOT EXISTS completion_yearbook_public_insert AFTER INSERT ON yearbook_public
BEGIN
 INSERT INTO profile_completion(member,completed_at,basis)
 SELECT id,CAST((julianday('now')-2440587.5)*86400000 AS INTEGER),'recorded'
 FROM completed_profiles_public WHERE id=NEW.member ON CONFLICT(member) DO NOTHING;
END;
CREATE TRIGGER IF NOT EXISTS completion_yearbook_public_update AFTER UPDATE ON yearbook_public
BEGIN
 INSERT INTO profile_completion(member,completed_at,basis)
 SELECT id,CAST((julianday('now')-2440587.5)*86400000 AS INTEGER),'recorded'
 FROM completed_profiles_public WHERE id=NEW.member ON CONFLICT(member) DO NOTHING;
END;
CREATE TRIGGER IF NOT EXISTS completion_roster_insert AFTER INSERT ON roster
BEGIN
 INSERT INTO profile_completion(member,completed_at,basis)
 SELECT id,CAST((julianday('now')-2440587.5)*86400000 AS INTEGER),'recorded'
 FROM completed_profiles_public WHERE id=NEW.id ON CONFLICT(member) DO NOTHING;
END;
CREATE TRIGGER IF NOT EXISTS completion_roster_update AFTER UPDATE ON roster
BEGIN
 INSERT INTO profile_completion(member,completed_at,basis)
 SELECT id,CAST((julianday('now')-2440587.5)*86400000 AS INTEGER),'recorded'
 FROM completed_profiles_public WHERE id=NEW.id ON CONFLICT(member) DO NOTHING;
END;
CREATE TRIGGER IF NOT EXISTS completion_profile_seeds_insert AFTER INSERT ON profile_seeds
BEGIN
 INSERT INTO profile_completion(member,completed_at,basis)
 SELECT id,CAST((julianday('now')-2440587.5)*86400000 AS INTEGER),'recorded'
 FROM completed_profiles_public WHERE id=NEW.roster_id ON CONFLICT(member) DO NOTHING;
END;
CREATE TRIGGER IF NOT EXISTS completion_profile_seeds_update AFTER UPDATE ON profile_seeds
BEGIN
 INSERT INTO profile_completion(member,completed_at,basis)
 SELECT id,CAST((julianday('now')-2440587.5)*86400000 AS INTEGER),'recorded'
 FROM completed_profiles_public WHERE id=NEW.roster_id ON CONFLICT(member) DO NOTHING;
END;
CREATE TRIGGER IF NOT EXISTS completion_photos_insert AFTER INSERT ON photos
BEGIN
 INSERT INTO profile_completion(member,completed_at,basis)
 SELECT c.id,CAST((julianday('now')-2440587.5)*86400000 AS INTEGER),'recorded'
 FROM completed_profiles_public c JOIN submissions s ON s.subject=c.id WHERE s.id=NEW.submission ON CONFLICT(member) DO NOTHING;
END;
CREATE TRIGGER IF NOT EXISTS completion_photos_update AFTER UPDATE ON photos
BEGIN
 INSERT INTO profile_completion(member,completed_at,basis)
 SELECT c.id,CAST((julianday('now')-2440587.5)*86400000 AS INTEGER),'recorded'
 FROM completed_profiles_public c JOIN submissions s ON s.subject=c.id WHERE s.id=NEW.submission ON CONFLICT(member) DO NOTHING;
END;
CREATE TRIGGER IF NOT EXISTS completion_profile_fields_delete AFTER DELETE ON profile_fields
BEGIN
 INSERT INTO profile_completion(member,completed_at,basis)
 SELECT id,CAST((julianday('now')-2440587.5)*86400000 AS INTEGER),'recorded'
 FROM completed_profiles_public WHERE id=OLD.member ON CONFLICT(member) DO NOTHING;
END;
CREATE TRIGGER IF NOT EXISTS completion_yearbook_public_delete AFTER DELETE ON yearbook_public
BEGIN
 INSERT INTO profile_completion(member,completed_at,basis)
 SELECT id,CAST((julianday('now')-2440587.5)*86400000 AS INTEGER),'recorded'
 FROM completed_profiles_public WHERE id=OLD.member ON CONFLICT(member) DO NOTHING;
END;
