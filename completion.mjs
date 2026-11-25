// Match the seven public profile requirements, respecting owner overrides (including blanks).
export const completedProfilesCTE = `WITH ranked_profile AS (
  SELECT member,field,value,row_number() OVER (
    PARTITION BY member,field ORDER BY priority DESC) AS choice
  FROM selected_profile_fields WHERE pilot_only<=?
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
)`;
