
-- Corregir emails con typo en records_3d (excluyendo c@c.con que es falso)
UPDATE records_3d SET email = CASE email
  WHEN 'a.colonnna.a@gmail.con' THEN 'a.colonnna.a@gmail.com'
  WHEN 'adrianaestelabenitez2002@gmal.com' THEN 'adrianaestelabenitez2002@gmail.com'
  WHEN 'alealvarezcoaching@gmail.con' THEN 'alealvarezcoaching@gmail.com'
  WHEN 'alejandrocia@gmail.con' THEN 'alejandrocia@gmail.com'
  WHEN 'analialuraschiestudio@gmail.con' THEN 'analialuraschiestudio@gmail.com'
  WHEN 'antonellacalabro@gmail.con' THEN 'antonellacalabro@gmail.com'
  WHEN 'corajestyle2@gmail.con' THEN 'corajestyle2@gmail.com'
  WHEN 'delcampo.m@gnail.com' THEN 'delcampo.m@gmail.com'
  WHEN 'diegodemichelis@gmai.com' THEN 'diegodemichelis@gmail.com'
  WHEN 'dvergagni@gmai.com' THEN 'dvergagni@gmail.com'
  WHEN 'edgardobuffa@gnail.com' THEN 'edgardobuffa@gmail.com'
  WHEN 'eleolatella@gnail.com' THEN 'eleolatella@gmail.com'
  WHEN 'evangelina.e.sosa@gmail.con' THEN 'evangelina.e.sosa@gmail.com'
  WHEN 'facundomaccio@gmail.con' THEN 'facundomaccio@gmail.com'
  WHEN 'fncolque@gnail.con' THEN 'fncolque@gmail.com'
  WHEN 'franciscogalmes@gmail.con' THEN 'franciscogalmes@gmail.com'
  WHEN 'gaby.santesteban@gmai.com' THEN 'gaby.santesteban@gmail.com'
  WHEN 'giselakluwak@gmail.con' THEN 'giselakluwak@gmail.com'
  WHEN 'jim_fml@yahoo.con' THEN 'jim_fml@yahoo.com'
  WHEN 'juanmanuelotegui4@gmai.com' THEN 'juanmanuelotegui4@gmail.com'
  WHEN 'juanpa150@hotmail.con' THEN 'juanpa150@hotmail.com'
  WHEN 'malbranines@gmail.con' THEN 'malbranines@gmail.com'
  WHEN 'manutuero@gmial.com' THEN 'manutuero@gmail.com'
  WHEN 'martin.vitola@outlook.con' THEN 'martin.vitola@outlook.com'
  WHEN 'mercedesfernandezlm@gmal.com' THEN 'mercedesfernandezlm@gmail.com'
  WHEN 'mercedesforte20@gmail.con' THEN 'mercedesforte20@gmail.com'
  WHEN 'mjazmincristaldo@gmail.con' THEN 'mjazmincristaldo@gmail.com'
  WHEN 'nicolassaporiti12@gmail.comn' THEN 'nicolassaporiti12@gmail.com'
  WHEN 'olivaresmatildem@gmail.con' THEN 'olivaresmatildem@gmail.com'
  WHEN 'oscar.inga@gmail.con' THEN 'oscar.inga@gmail.com'
  WHEN 'pablomare96@gmail.con' THEN 'pablomare96@gmail.com'
  WHEN 'palacios.carlos@outloo.com' THEN 'palacios.carlos@outlook.com'
  WHEN 'puraemocion@gmail.comn' THEN 'puraemocion@gmail.com'
  WHEN 'robertoosalaas@gmail.con' THEN 'robertoosalaas@gmail.com'
  WHEN 'sebagaray78@gmail.con' THEN 'sebagaray78@gmail.com'
  WHEN 'tomi.gonzalo@gmail.con' THEN 'tomi.gonzalo@gmail.com'
  ELSE email
END
WHERE email IN (
  'a.colonnna.a@gmail.con', 'adrianaestelabenitez2002@gmal.com', 'alealvarezcoaching@gmail.con',
  'alejandrocia@gmail.con', 'analialuraschiestudio@gmail.con', 'antonellacalabro@gmail.con',
  'corajestyle2@gmail.con', 'delcampo.m@gnail.com', 'diegodemichelis@gmai.com',
  'dvergagni@gmai.com', 'edgardobuffa@gnail.com', 'eleolatella@gnail.com',
  'evangelina.e.sosa@gmail.con', 'facundomaccio@gmail.con', 'fncolque@gnail.con',
  'franciscogalmes@gmail.con', 'gaby.santesteban@gmai.com', 'giselakluwak@gmail.con',
  'jim_fml@yahoo.con', 'juanmanuelotegui4@gmai.com', 'juanpa150@hotmail.con',
  'malbranines@gmail.con', 'manutuero@gmial.com', 'martin.vitola@outlook.con',
  'mercedesfernandezlm@gmal.com', 'mercedesforte20@gmail.con', 'mjazmincristaldo@gmail.con',
  'nicolassaporiti12@gmail.comn', 'olivaresmatildem@gmail.con', 'oscar.inga@gmail.con',
  'pablomare96@gmail.con', 'palacios.carlos@outloo.com', 'puraemocion@gmail.comn',
  'robertoosalaas@gmail.con', 'sebagaray78@gmail.con', 'tomi.gonzalo@gmail.con'
);

-- Corregir en outbound_emails también
UPDATE outbound_emails SET to_email = CASE to_email
  WHEN 'a.colonnna.a@gmail.con' THEN 'a.colonnna.a@gmail.com'
  WHEN 'adrianaestelabenitez2002@gmal.com' THEN 'adrianaestelabenitez2002@gmail.com'
  WHEN 'alealvarezcoaching@gmail.con' THEN 'alealvarezcoaching@gmail.com'
  WHEN 'alejandrocia@gmail.con' THEN 'alejandrocia@gmail.com'
  WHEN 'analialuraschiestudio@gmail.con' THEN 'analialuraschiestudio@gmail.com'
  WHEN 'antonellacalabro@gmail.con' THEN 'antonellacalabro@gmail.com'
  WHEN 'corajestyle2@gmail.con' THEN 'corajestyle2@gmail.com'
  WHEN 'delcampo.m@gnail.com' THEN 'delcampo.m@gmail.com'
  WHEN 'diegodemichelis@gmai.com' THEN 'diegodemichelis@gmail.com'
  WHEN 'dvergagni@gmai.com' THEN 'dvergagni@gmail.com'
  WHEN 'edgardobuffa@gnail.com' THEN 'edgardobuffa@gmail.com'
  WHEN 'eleolatella@gnail.com' THEN 'eleolatella@gmail.com'
  WHEN 'evangelina.e.sosa@gmail.con' THEN 'evangelina.e.sosa@gmail.com'
  WHEN 'facundomaccio@gmail.con' THEN 'facundomaccio@gmail.com'
  WHEN 'fncolque@gnail.con' THEN 'fncolque@gmail.com'
  WHEN 'franciscogalmes@gmail.con' THEN 'franciscogalmes@gmail.com'
  WHEN 'gaby.santesteban@gmai.com' THEN 'gaby.santesteban@gmail.com'
  WHEN 'giselakluwak@gmail.con' THEN 'giselakluwak@gmail.com'
  WHEN 'jim_fml@yahoo.con' THEN 'jim_fml@yahoo.com'
  WHEN 'juanmanuelotegui4@gmai.com' THEN 'juanmanuelotegui4@gmail.com'
  WHEN 'juanpa150@hotmail.con' THEN 'juanpa150@hotmail.com'
  WHEN 'malbranines@gmail.con' THEN 'malbranines@gmail.com'
  WHEN 'manutuero@gmial.com' THEN 'manutuero@gmail.com'
  WHEN 'martin.vitola@outlook.con' THEN 'martin.vitola@outlook.com'
  WHEN 'mercedesfernandezlm@gmal.com' THEN 'mercedesfernandezlm@gmail.com'
  WHEN 'mercedesforte20@gmail.con' THEN 'mercedesforte20@gmail.com'
  WHEN 'mjazmincristaldo@gmail.con' THEN 'mjazmincristaldo@gmail.com'
  WHEN 'nicolassaporiti12@gmail.comn' THEN 'nicolassaporiti12@gmail.com'
  WHEN 'olivaresmatildem@gmail.con' THEN 'olivaresmatildem@gmail.com'
  WHEN 'oscar.inga@gmail.con' THEN 'oscar.inga@gmail.com'
  WHEN 'pablomare96@gmail.con' THEN 'pablomare96@gmail.com'
  WHEN 'palacios.carlos@outloo.com' THEN 'palacios.carlos@outlook.com'
  WHEN 'puraemocion@gmail.comn' THEN 'puraemocion@gmail.com'
  WHEN 'robertoosalaas@gmail.con' THEN 'robertoosalaas@gmail.com'
  WHEN 'sebagaray78@gmail.con' THEN 'sebagaray78@gmail.com'
  WHEN 'tomi.gonzalo@gmail.con' THEN 'tomi.gonzalo@gmail.com'
  ELSE to_email
END
WHERE to_email IN (
  'a.colonnna.a@gmail.con', 'adrianaestelabenitez2002@gmal.com', 'alealvarezcoaching@gmail.con',
  'alejandrocia@gmail.con', 'analialuraschiestudio@gmail.con', 'antonellacalabro@gmail.con',
  'corajestyle2@gmail.con', 'delcampo.m@gnail.com', 'diegodemichelis@gmai.com',
  'dvergagni@gmai.com', 'edgardobuffa@gnail.com', 'eleolatella@gnail.com',
  'evangelina.e.sosa@gmail.con', 'facundomaccio@gmail.con', 'fncolque@gnail.con',
  'franciscogalmes@gmail.con', 'gaby.santesteban@gmai.com', 'giselakluwak@gmail.con',
  'jim_fml@yahoo.con', 'juanmanuelotegui4@gmai.com', 'juanpa150@hotmail.con',
  'malbranines@gmail.con', 'manutuero@gmial.com', 'martin.vitola@outlook.con',
  'mercedesfernandezlm@gmal.com', 'mercedesforte20@gmail.con', 'mjazmincristaldo@gmail.con',
  'nicolassaporiti12@gmail.comn', 'olivaresmatildem@gmail.con', 'oscar.inga@gmail.con',
  'pablomare96@gmail.con', 'palacios.carlos@outloo.com', 'puraemocion@gmail.comn',
  'robertoosalaas@gmail.con', 'sebagaray78@gmail.con', 'tomi.gonzalo@gmail.con'
);
