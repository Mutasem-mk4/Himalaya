-- Update the user role to chalet_owner for mutasemjzzar@gmail.com
UPDATE user_roles
SET role = 'chalet_owner'
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'mutasemjzzar@gmail.com'
);