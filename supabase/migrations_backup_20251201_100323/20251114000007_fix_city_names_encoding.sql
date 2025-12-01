-- =====================================================
-- MIGRACIÓN: Corregir nombres de ciudades con tildes mal codificadas
-- Problema: Nombres almacenados con encoding incorrecto (UTF-8 mal interpretado)
-- Solución: Actualizar nombres usando IDs como referencia
-- =====================================================
-- EJECUTAR: npx supabase db push --dns-resolver https
-- =====================================================

-- Actualizar todos los nombres de ciudades con encoding correcto
UPDATE cities SET name = 'MOTAVITA' WHERE id = 'd39d8c0c-dad4-474f-81dc-000d9b93ab9c';
UPDATE cities SET name = 'BARBOSA' WHERE id = 'a8f268c8-e25b-46e6-b479-0016417df2f9';
UPDATE cities SET name = 'POLICARPA' WHERE id = '47f8e258-5a3a-44fd-a381-00aee626db4c';
UPDATE cities SET name = 'FLORENCIA' WHERE id = 'e5296ddf-57a2-467c-8aff-00e788bbc8dc';
UPDATE cities SET name = 'TARAZÁ' WHERE id = 'aa676a5d-6057-4b34-b60d-0115a733c620';
UPDATE cities SET name = 'AIPE' WHERE id = '0b53a097-005d-481f-8574-013cff967537';
UPDATE cities SET name = 'DOLORES' WHERE id = 'ea7a4198-9239-47a9-9e20-013fef99cd8a';
UPDATE cities SET name = 'QUÍPAMA' WHERE id = 'e422f3f9-3c58-41dd-9278-0158738ce4dd';
UPDATE cities SET name = 'CHACHAGÜÍ' WHERE id = 'ff6ceff0-4c23-417d-bd99-01621bd0a208';
UPDATE cities SET name = 'YUMBO' WHERE id = '51340359-db90-4d20-aab3-01c74715249e';
UPDATE cities SET name = 'TIBÚ' WHERE id = 'a52d4f2b-2af3-41d6-bea1-01ddef87d5f6';
UPDATE cities SET name = 'SALDAÑA' WHERE id = '7f0f443b-b9a0-4768-9d53-02361bd35f47';
UPDATE cities SET name = 'JARDÍN' WHERE id = '722c1159-59b9-48ce-8d25-02bd4a1d49be';
UPDATE cities SET name = 'JUNÍN' WHERE id = 'fd7671a9-f264-4276-b918-02c69ecdb556';
UPDATE cities SET name = 'ARANZAZU' WHERE id = '17bd07f0-f2da-4e78-b6c1-030b5c4956d6';
UPDATE cities SET name = 'SAN AGUSTÍN' WHERE id = '2dfe08a2-9a8b-4e63-8a8d-0316f92cfefe';
UPDATE cities SET name = 'NECHÍ' WHERE id = '4487a7a2-19f1-4d71-94d6-033baf78ddac';
UPDATE cities SET name = 'RÍO DE ORO' WHERE id = '22eb071d-2e6e-49ce-9585-037cbbd09bf2';
UPDATE cities SET name = 'ÚMBITA' WHERE id = 'a8f50286-82b8-484c-9a6a-038ad840e251';
UPDATE cities SET name = 'BELALCÁZAR' WHERE id = '03b5aab5-70e3-4fa5-a325-039aa3928bb4';
UPDATE cities SET name = 'PUERTO LLERAS' WHERE id = '5993c5d3-9229-4d6a-9633-03b9f9e33d97';
UPDATE cities SET name = 'VISTAHERMOSA' WHERE id = '3821e190-7cf1-4416-a3ba-047855ae9bf4';
UPDATE cities SET name = 'SAN BERNARDO DEL VIENTO' WHERE id = 'da4343b0-a9f9-435b-a537-04b2e9188145';
UPDATE cities SET name = 'EL PLAYÓN' WHERE id = '8b386dac-0230-4630-abd8-05cd3ead7245';
UPDATE cities SET name = 'MONIQUIRÁ' WHERE id = 'debae5d7-abed-4a3f-b68d-05f960cbc24f';
UPDATE cities SET name = 'BETANIA' WHERE id = '261c7115-d95a-45d3-97fe-0636a0fda8e4';
UPDATE cities SET name = 'TIPACOQUE' WHERE id = 'fb4060aa-3264-4c05-b9d0-066ffef78954';
UPDATE cities SET name = 'BARICHARA' WHERE id = 'd8a4e314-7d0d-4f96-8ef7-067a22d21ff5';
UPDATE cities SET name = 'SAN JOSÉ DE LA MONTAÑA' WHERE id = '0efb3d48-3a11-4cc3-812e-06e78d24fbac';
UPDATE cities SET name = 'LA GUADALUPE' WHERE id = '6e660a9a-a8f0-432d-ae73-073a49071f4d';
UPDATE cities SET name = 'EL CARMEN DE CHUCURÍ' WHERE id = 'bc172cfd-6ee3-425b-bad2-074a680ee346';
UPDATE cities SET name = 'SABANALARGA' WHERE id = '7e2d2ad1-e8f7-4895-9f02-07636c0a41e0';
UPDATE cities SET name = 'SANTA HELENA DEL OPÓN' WHERE id = '314cd106-9abd-4d1a-b809-078c9eabb0e4';
UPDATE cities SET name = 'GUAYABAL DE SÍQUIMA' WHERE id = 'eab87be8-e346-4937-9818-07939ad6e0f6';
UPDATE cities SET name = 'SAN PEDRO DE CARTAGO' WHERE id = '66bce142-1e90-428b-8fb8-07b416e77dae';
UPDATE cities SET name = 'NATAGAIMA' WHERE id = 'cff81918-cbb3-458d-bf34-07c2deeec50f';
UPDATE cities SET name = 'SALADOBLANCO' WHERE id = '4d0cc1d4-2d62-4063-a3e6-07fb7f88b503';
UPDATE cities SET name = 'TIMBÍO' WHERE id = 'b9bf6f99-7b58-4826-8fe0-0803b38158f4';
UPDATE cities SET name = 'SALAZAR' WHERE id = 'e0153b63-4f14-4e16-b4f0-084571b1edc5';
UPDATE cities SET name = 'LABRANZAGRANDE' WHERE id = '20dbbc9a-f345-4e32-a961-08484613d035';
UPDATE cities SET name = 'CONCORDIA' WHERE id = '9827c971-967e-4636-93ef-08ac751348ce';
UPDATE cities SET name = 'BITUIMA' WHERE id = '550dba1a-cd36-43fb-9650-08b58eb99737';
UPDATE cities SET name = 'ATRATO' WHERE id = '577b995a-616c-46ab-bf04-09257e41422f';
UPDATE cities SET name = 'FUSAGASUGÁ' WHERE id = 'e828e899-2e6f-45c8-93fb-09576cb6dc45';
UPDATE cities SET name = 'SUBACHOQUE' WHERE id = 'a63878f4-b338-4322-8f93-09b1a4e3855b';
UPDATE cities SET name = 'HACARÍ' WHERE id = 'e6fc7cc1-0844-47a0-acbe-0a6534b696c0';
UPDATE cities SET name = 'EL PASO' WHERE id = '54624958-b2d8-491c-9fbf-0ac201fe3393';
UPDATE cities SET name = 'ARROYOHONDO' WHERE id = 'd10418de-de7a-4419-82e5-0ae9b39a66ff';
UPDATE cities SET name = 'PAZ DE ARIPORO' WHERE id = 'f168ac87-191a-4cc6-891a-0af0a3344fe4';
UPDATE cities SET name = 'ICONONZO' WHERE id = '1ff6fc59-11d0-4590-bafa-0b631aeb9deb';
UPDATE cities SET name = 'ZARAGOZA' WHERE id = '2423d558-538d-4362-8fc6-0b64ff29c690';
UPDATE cities SET name = 'SOTAQUIRÁ' WHERE id = 'b02fb155-c59b-4db5-9e80-0c127ffbd4a2';
UPDATE cities SET name = 'RESTREPO' WHERE id = '13c94c38-9ccf-4a54-9a5b-0c2574693c26';
UPDATE cities SET name = 'PUEBLO RICO' WHERE id = '146847d2-bef7-4656-bb0e-0c355744788c';
UPDATE cities SET name = 'COLOSÓ' WHERE id = 'd513c9df-09df-4efa-8cd8-0c361c6ba167';
UPDATE cities SET name = 'GUAYABETAL' WHERE id = '1883bccf-74dd-4379-970e-0d0ea6e2c7e1';
UPDATE cities SET name = 'CIMITARRA' WHERE id = 'c9e88271-948b-482b-a0e2-0d6d8bd4ccaf';
UPDATE cities SET name = 'LA PALMA' WHERE id = 'c43d1941-8293-4933-923c-0d7b1dbb3dae';
UPDATE cities SET name = 'MAJAGUAL' WHERE id = 'c2c13937-c222-4227-92fd-0d903669d65f';
UPDATE cities SET name = 'USIACURÍ' WHERE id = '8db41a1f-600c-4acb-adad-0e1a455529b8';
UPDATE cities SET name = 'TUCHÍN' WHERE id = 'b74eb061-0d28-4bbe-b75a-0eb0ce2bd563';
UPDATE cities SET name = 'CHALÁN' WHERE id = '5a92da5e-2c63-4156-883c-0ec01e83a6f2';
UPDATE cities SET name = 'PIVIJAY' WHERE id = '63b3a383-0fac-479b-888c-0eeff6a75cde';
UPDATE cities SET name = 'SESQUILÉ' WHERE id = 'a7c400db-64c3-4474-8270-0f23b8c6f2cb';
UPDATE cities SET name = 'PUERTO LEGUÍZAMO' WHERE id = '6591f77b-3f7c-4b4c-a8ff-0f4b13628c5a';
UPDATE cities SET name = 'EL DONCELLO' WHERE id = '11d8d25e-9fa1-4723-9508-0f509428dc13';
UPDATE cities SET name = 'CABUYARO' WHERE id = '289c926f-5a11-448b-bb39-0f5fbec9c255';
UPDATE cities SET name = 'CALDAS' WHERE id = 'b372afa2-45e9-4ea2-bcaa-0f84fbaf98fc';
UPDATE cities SET name = 'PARATEBUENO' WHERE id = '2e047cad-1dc9-4ad2-b46e-0fb2bbfa533a';
UPDATE cities SET name = 'FUNES' WHERE id = '8e496c94-7d73-43af-9f13-11378a199077';
UPDATE cities SET name = 'SAN LUIS DE PALENQUE' WHERE id = 'b0570dc8-b15a-4191-a633-113f15671bcc';
UPDATE cities SET name = 'LURUACO' WHERE id = '4529d754-81b5-44cb-87aa-11d66347ca43';
UPDATE cities SET name = 'CHÍA' WHERE id = '461018f8-396c-4b28-9220-11ee23919580';
UPDATE cities SET name = 'VILLANUEVA' WHERE id = 'a256a7da-d5e8-412c-b40c-12255ce754f9';
UPDATE cities SET name = 'ALBÁN' WHERE id = '34d3a46e-4d32-42d7-a12a-122c4124c2e9';
UPDATE cities SET name = 'SAN MARTÍN' WHERE id = 'c1d916a0-2d50-4edb-b741-124df2db5cb6';
UPDATE cities SET name = 'MATANZA' WHERE id = '31d09ab3-2315-4c1f-bff6-1273c5ed37b9';
UPDATE cities SET name = 'CASTILLA LA NUEVA' WHERE id = 'd03c7105-2fba-464e-8320-12f27c8927eb';
UPDATE cities SET name = 'CIÉNAGA' WHERE id = 'a36de5a4-3980-4f42-b1f6-130892422a8b';
UPDATE cities SET name = 'SANTA FÉ DE ANTIOQUIA' WHERE id = 'fbb51d22-8162-4462-8fcd-131e33beeb6c';
UPDATE cities SET name = 'SUTATAUSA' WHERE id = 'eb6aec8f-fcf1-49e2-b05c-135ccd4653d6';
UPDATE cities SET name = 'MOLAGAVITA' WHERE id = '7944c92e-ef22-4460-b463-1363b0d19815';
UPDATE cities SET name = 'EL TAMBO' WHERE id = '819ce116-6ea8-4804-83ac-141cec3f2ac6';
UPDATE cities SET name = 'SARAVENA' WHERE id = 'c98a9856-b44e-411b-81d4-14aa4bd0a0d0';
UPDATE cities SET name = 'ALBÁN' WHERE id = '361ab1be-e72e-4bfb-a179-14af0327fbd3';
UPDATE cities SET name = 'CHÍQUIZA' WHERE id = 'a5b10056-0097-49f6-81ea-14b74dced6ec';
UPDATE cities SET name = 'ROBERTO PAYÁN' WHERE id = 'ef92b84a-9efa-49a0-b6f0-150f6303dbc6';
UPDATE cities SET name = 'GALAPA' WHERE id = '9da45a9d-3420-4090-a8da-15161705900c';
UPDATE cities SET name = 'SUAITA' WHERE id = '1c144590-e126-44b7-b0b2-1544ef8fdaf9';
UPDATE cities SET name = 'GUAITARILLA' WHERE id = '9c21eb77-b308-4a09-b98e-158fb2d43b68';
UPDATE cities SET name = 'PUERTO GAITÁN' WHERE id = 'c3ff9bb7-e9e5-4508-ba66-164843ac991d';
UPDATE cities SET name = 'VIJES' WHERE id = '545742e8-e4df-4fd9-b1b3-165283414340';
UPDATE cities SET name = 'SANTIAGO' WHERE id = '894272ef-58a9-4c67-8cbe-1659449adff1';
UPDATE cities SET name = 'EL ROBLE' WHERE id = '8053991e-a39a-46ac-a96f-16795727ca0c';
UPDATE cities SET name = 'ULLOA' WHERE id = 'b26f418c-651b-4b93-b517-16937fd78fca';
UPDATE cities SET name = 'GRANADA' WHERE id = '779b152d-b575-4597-b0d8-17256151ad7f';
UPDATE cities SET name = 'EL DOVIO' WHERE id = 'f5b4fd32-5038-4191-aa7a-172fa48bc399';
UPDATE cities SET name = 'BOGOTÁ, D.C.' WHERE id = 'c5861b80-bd05-48a9-9e24-d8c93e0d1d6b';
UPDATE cities SET name = 'LÍBANO' WHERE id = '9aeac893-1bac-480e-b9bb-da7f93a24135';
UPDATE cities SET name = 'CÓRDOBA' WHERE id = '08e7f32b-9229-487e-94b2-da8faf35cbe8';
UPDATE cities SET name = 'QUINCHÍA' WHERE id = '45ba6848-be24-48c9-8d03-dabb1134df7e';
UPDATE cities SET name = 'MURINDÓ' WHERE id = '9ce2bc8f-5491-4cac-a71a-dae60db58bb0';
UPDATE cities SET name = 'ZIPAQUIRÁ' WHERE id = '0b7b62fb-ab1e-4188-aa2e-dc74adc83758';
UPDATE cities SET name = 'CHINÁCOTA' WHERE id = '55609773-438c-44e3-add6-dcf839e930d5';
UPDATE cities SET name = 'CHOACHÍ' WHERE id = 'f82cd3d6-f831-4fe6-89bc-ddf1d562edfd';
UPDATE cities SET name = 'CUÍTIVA' WHERE id = '01cf2907-b9d2-4981-afae-de728c6d57dc';
UPDATE cities SET name = 'TOCANCIPÁ' WHERE id = 'd98f3f94-f704-4854-8bfa-de871139dcbf';
UPDATE cities SET name = 'CHARALÁ' WHERE id = 'e0f0f755-1bf9-43f6-822a-de98af8023b8';
UPDATE cities SET name = 'MONTERÍA' WHERE id = 'd6917223-e68e-49d5-a61b-df7c28149f76';
UPDATE cities SET name = 'MIRITÍ - PARANÁ' WHERE id = '58ec2a32-d824-41bb-9807-dfa77b14d119';
UPDATE cities SET name = 'TURMEQUÉ' WHERE id = '09d397c6-34b7-436c-aabe-e0125ce0d3a7';
UPDATE cities SET name = 'CAPARRAPÍ' WHERE id = '0232b82a-01b0-4375-a8b2-e0144431b9eb';
UPDATE cities SET name = 'ARBELÁEZ' WHERE id = 'd9cd26f7-3a3c-46e8-a9ac-e1cecaabba60';
UPDATE cities SET name = 'NÁTAGA' WHERE id = '43f91a52-d7cc-4bdb-94bd-d660c2c7f064';
UPDATE cities SET name = 'CÓMBITA' WHERE id = '6c09d892-406c-45e9-9032-d82e2873e216';
UPDATE cities SET name = 'CIÉNAGA DE ORO' WHERE id = '4fbb8457-5118-4032-8e0b-ce4d5545cf87';
UPDATE cities SET name = 'EBÉJICO' WHERE id = '0f3cb564-5999-4316-87aa-d000b8be4232';
UPDATE cities SET name = 'SUPATÁ' WHERE id = 'ebe7f4eb-e7ff-4e57-a240-d0986a46e46d';
UPDATE cities SET name = 'TÁMESIS' WHERE id = 'af9a2a09-72f2-4b2e-958b-d3d595458a38';
UPDATE cities SET name = 'CARACOLÍ' WHERE id = 'ebe3fe95-adca-4110-8982-d4212e401ce1';
UPDATE cities SET name = 'VIGÍA DEL FUERTE' WHERE id = '4646c96e-13bd-42f7-b689-db19b3782959';
-- =====================================================
-- COMENTARIOS
-- =====================================================
COMMENT ON TABLE cities IS 'Tabla de ciudades - Nombres corregidos con encoding UTF-8 apropiado (2025-11-14)';
-- =====================================================
-- VERIFICACIÓN
-- =====================================================
-- Para verificar que los nombres se actualizaron correctamente:
SELECT id, name FROM cities WHERE name LIKE '%�%' OR name LIKE '%Ã%' OR name LIKE '%Â%';
-- Si retorna 0 filas, la migración fue exitosa;
