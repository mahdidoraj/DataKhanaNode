ft360_ir => 1597623462

//get Posts
fetch("https://www.instagram.com/graphql/query", {
  "headers": {
    "accept": "*/*",
    "accept-language": "en-US,en;q=0.9",
    "content-type": "application/x-www-form-urlencoded",
    "priority": "u=1, i",
    "sec-ch-prefers-color-scheme": "dark",
    "sec-ch-ua": "\"Not;A=Brand\";v=\"99\", \"Google Chrome\";v=\"139\", \"Chromium\";v=\"139\"",
    "sec-ch-ua-full-version-list": "\"Not;A=Brand\";v=\"99.0.0.0\", \"Google Chrome\";v=\"139.0.7258.155\", \"Chromium\";v=\"139.0.7258.155\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-model": "\"\"",
    "sec-ch-ua-platform": "\"macOS\"",
    "sec-ch-ua-platform-version": "\"13.7.6\"",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    "x-asbd-id": "359341",
    "x-bloks-version-id": "64f02abc184fb0d9135db12e85e451a3be71c64f7231c320a09e7df0ef1bdf6d",
    "x-csrftoken": "nyxuHUOb6A4ZmAzuZANh2GTN5bGxmI6G",
    "x-fb-friendly-name": "PolarisProfilePostsQuery",
    "x-fb-lsd": "V0FmMBQi8bT6hKnQlKO3__",
    "x-ig-app-id": "936619743392459",
    "x-root-field-name": "xdt_api__v1__feed__user_timeline_graphql_connection",
    "cookie": "datr=gg_IaFJwm_qfFBo0llxwIemZ; ig_did=E17C528C-F6BD-464F-BA5E-BEE6C21B509C; mid=aMgPggAEAAGQczMZmteuxZq5eu8S; ps_l=1; ps_n=1; csrftoken=nyxuHUOb6A4ZmAzuZANh2GTN5bGxmI6G; ds_user_id=76948878513; sessionid=76948878513%3AYL3GuMjiR2dLeG%3A0%3AAYhMAxIzCrRZngVihE-b2CSrE4maKO27bTF7kF_iKQ; rur=\"RVA\\05476948878513\\0541789477749:01feefa133e2b6bf2f6ebc4f2432407a0a811bcfc69c53c70a86f56423eece9042a61a3d\"; wd=1294x719",
    "Referer": "https://www.instagram.com/"
  },
  "body": "av=17841476995408609&__d=www&__user=0&__a=1&__req=1c&__hs=20346.HYP%3Ainstagram_web_pkg.2.1...0&dpr=2&__ccg=MODERATE&__rev=1027114106&__s=ctc0a6%3A2mdyw6%3A3pjrlc&__hsi=7550302239217904971&__dyn=7xeUjG1mxu1syUbFp41twWwIxu13wvoKewSAwHwNw9G2S7o2vwa24o0B-q1ew6ywaq0yE462mcw5Mx62G5UswoEcE7O2l0Fwqo31w9a9wtUd8-U2zxe2GewGw9a361qwuEjUlwhEe87q0oa2-azqwt8d-2u2J0bS1LwTwKG1pg2fwxyo6O1FwlA3a3zhA6bwIxeUnAwCAxW1oxe6UaU6W1tyVrx60gm5osxWawOwgV84qdxq&__csr=ghg8Q4BPSOYXFj8G9aB5AkBsrcASytA8lbQnFpoNHKidVAV4LiHVCHZfjhduiAjKnFykq9JuLF5yaAFJ2GG9K8AXjKfVpEyqi8QnKu8G8DBBGdgyl2u8B-6fHx3jGGx9ACgGcJoK9glxy4BKaHyGG9Bxyp2umeyK74FaUyUyaCyoHxi4LzpV94aymUgw05svx21Ayu8U0hlg0Vi0QoCbDwdQPxwM1gk0cFwro0Ce3G3OsE0TsMKFV-1QwAxe1zyoK8zVUzgrw8mm3Ijg84bDy9m1B82-fg1CJw9S2C22Owp8Cbw4mwdR90eAwbE6l0RAm0enw93wtUyU07NS04vE27w17e054o&__hsdp=gmgB15lsl4NkTbE8jvGhq6Swj93bDJF9rAHjEv45yNhDQbVyVbz7KzKAgUoUqx-dAhB5PwygLIuSl348K95aex1CEwGyAOL2sgNwNxmO7gd8gx4w9C56449XwgUC3iawk9A2EVUqx-eDwDwno6idx-2K0QU-E9oSm5K0WU27wtE760qOu0qd0n80w61qwiUuwi8kwc6dwbiE5m0IU32w9i1ww4i81igb8hw5GwaW1cAAbo4O0g21Gwl8f8&__hblp=0RCwNz8fErxa4opx13EsAglx26u68mwou6U463yfyV5Urxamdwj8h8awDgSHzEjDyUhU8VUWm2e449gCmElDmu2OUnwg8hAK7UWu799po9uF8S4VqBwXx-dw_yUy1xwoElG2mprBxe0Y9U5B0AwnEnwsojxqi1UwfKuu586W0hZ0ZxW2C2a0p22e1qwiVEnyUf8kyUfU6yczof8eoeo5O0FoS782Bw9i11xW0h8w4Sh0IgSA1Lwfem2G6o4-6pk15AA4G2C7U6O18wiGx61lwZxqbzU88&__sjsp=gmgB15lshEh5jsKwxd-F5Erq1cAcKuSABKiJexYg4hhCQbVHVbz7DyayUoxO7USmphoer7JBzk8K95aex1CEwGyAOL2sgNwaEfEgwXo0Ie0_U6fw&__comet_req=7&fb_dtsg=NAfvJ9KgXDjF5BNtJ1Jr5Yp6Fbu6mvoaX4vf9D6uk3mF2uBLMg7zRyQ%3A17865145036029998%3A1757941722&jazoest=26193&lsd=V0FmMBQi8bT6hKnQlKO3__&__spin_r=1027114106&__spin_b=trunk&__spin_t=1757941730&__crn=comet.igweb.PolarisFeedRoute&fb_api_caller_class=RelayModern&fb_api_req_friendly_name=PolarisProfilePostsQuery&variables=%7B%22data%22%3A%7B%22count%22%3A12%2C%22include_reel_media_seen_timestamp%22%3Atrue%2C%22include_relationship_info%22%3Atrue%2C%22latest_besties_reel_media%22%3Atrue%2C%22latest_reel_media%22%3Atrue%7D%2C%22username%22%3A%22ft360_ir%22%2C%22__relay_internal__pv__PolarisIsLoggedInrelayprovider%22%3Atrue%7D&server_timestamps=true&doc_id=24508118615505772",
  "method": "POST"
});

// get UserDetails
fetch("https://www.instagram.com/graphql/query", {
  "headers": {
    "accept": "*/*",
    "accept-language": "en-US,en;q=0.9",
    "content-type": "application/x-www-form-urlencoded",
    "priority": "u=1, i",
    "sec-ch-prefers-color-scheme": "dark",
    "sec-ch-ua": "\"Not;A=Brand\";v=\"99\", \"Google Chrome\";v=\"139\", \"Chromium\";v=\"139\"",
    "sec-ch-ua-full-version-list": "\"Not;A=Brand\";v=\"99.0.0.0\", \"Google Chrome\";v=\"139.0.7258.155\", \"Chromium\";v=\"139.0.7258.155\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-model": "\"\"",
    "sec-ch-ua-platform": "\"macOS\"",
    "sec-ch-ua-platform-version": "\"13.7.6\"",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    "x-asbd-id": "359341",
    "x-bloks-version-id": "64f02abc184fb0d9135db12e85e451a3be71c64f7231c320a09e7df0ef1bdf6d",
    "x-csrftoken": "nyxuHUOb6A4ZmAzuZANh2GTN5bGxmI6G",
    "x-fb-friendly-name": "PolarisProfilePageContentQuery",
    "x-fb-lsd": "V0FmMBQi8bT6hKnQlKO3__",
    "x-ig-app-id": "936619743392459",
    "x-root-field-name": "fetch__XDTUserDict",
    "cookie": "datr=gg_IaFJwm_qfFBo0llxwIemZ; ig_did=E17C528C-F6BD-464F-BA5E-BEE6C21B509C; mid=aMgPggAEAAGQczMZmteuxZq5eu8S; ps_l=1; ps_n=1; csrftoken=nyxuHUOb6A4ZmAzuZANh2GTN5bGxmI6G; ds_user_id=76948878513; sessionid=76948878513%3AYL3GuMjiR2dLeG%3A0%3AAYhMAxIzCrRZngVihE-b2CSrE4maKO27bTF7kF_iKQ; rur=\"RVA\\05476948878513\\0541789477749:01feefa133e2b6bf2f6ebc4f2432407a0a811bcfc69c53c70a86f56423eece9042a61a3d\"; wd=1294x719",
    "Referer": "https://www.instagram.com/"
  },
  "body": "av=17841476995408609&__d=www&__user=0&__a=1&__req=18&__hs=20346.HYP%3Ainstagram_web_pkg.2.1...0&dpr=2&__ccg=MODERATE&__rev=1027114106&__s=ctc0a6%3A2mdyw6%3A3pjrlc&__hsi=7550302239217904971&__dyn=7xeUjG1mxu1syUbFp41twWwIxu13wvoKewSAwHwNw9G2S7o2vwa24o0B-q1ew6ywaq0yE462mcw5Mx62G5UswoEcE7O2l0Fwqo31w9a9wtUd8-U2zxe2GewGw9a361qwuEjUlwhEe87q0oa2-azqwt8d-2u2J0bS1LwTwKG1pg2fwxyo6O1FwlA3a3zhA6bwIxeUnAwCAxW1oxe6UaU6W1tyVrx60gm5osxWawOwgV84qdxq&__csr=ghg8Q4BPSOYXFj8G9aB5AkBsrcASytA8lbQnFpoNHKidVAV4LiHVCHZfjhduiAjKnFykq9JuLF5yaAFJ2GG9K8AXjKfVpEyqi8QnKu8G8DBBGdgyl2u8B-6fHx3jGGx9ACgGcJoK9glxy4BKaHyGG9Bxyp2umeyK74FaUyUyaCyoHxi4LzpV94aymUgw05svx21Ayu8U0hlg0Vi0QoCbDwdQPxwM1gk0cFwro0Ce3G3OsE0TsMKFV-1QwAxe1zyoK8zVUzgrw8mm3Ijg84bDy9m1B82-fg1CJw9S2C22Owp8Cbw4mwdR90eAwbE6l0RAm0enw93wtUyU07NS04vE27w17e054o&__hsdp=gmgB15lsl4NkTbE8jvGhq6Swj93bDJF9rAHjEv45yNhDQbVyVbz7KzKAgUoUqx-dAhB5PwygLIuSl348K95aex1CEwGyAOL2sgNwNxmO7gd8gx4w9C56449XwgUC3iawk9A2EVUqx-eDwDwno6idx-2K0QU-E9oSm5K0WU27wtE760qOu0qd0n80w61qwiUuwi8kwc6dwbiE5m0IU32w9i1ww4i81igb8hw5GwaW1cAAbo4O0g21Gwl8f8&__hblp=0RCwNz8fErxa4opx13EsAglx26u68mwou6U463yfyV5Urxamdwj8h8awDgSHzEjDyUhU8VUWm2e449gCmElDmu2OUnwg8hAK7UWu799po9uF8S4VqBwXx-dw_yUy1xwoElG2mprBxe0Y9U5B0AwnEnwsojxqi1UwfKuu586W0hZ0ZxW2C2a0p22e1qwiVEnyUf8kyUfU6yczof8eoeo5O0FoS782Bw9i11xW0h8w4Sh0IgSA1Lwfem2G6o4-6pk15AA4G2C7U6O18wiGx61lwZxqbzU88&__sjsp=gmgB15lshEh5jsKwxd-F5Erq1cAcKuSABKiJexYg4hhCQbVHVbz7DyayUoxO7USmphoer7JBzk8K95aex1CEwGyAOL2sgNwaEfEgwXo0Ie0_U6fw&__comet_req=7&fb_dtsg=NAfvJ9KgXDjF5BNtJ1Jr5Yp6Fbu6mvoaX4vf9D6uk3mF2uBLMg7zRyQ%3A17865145036029998%3A1757941722&jazoest=26193&lsd=V0FmMBQi8bT6hKnQlKO3__&__spin_r=1027114106&__spin_b=trunk&__spin_t=1757941730&__crn=comet.igweb.PolarisFeedRoute&fb_api_caller_class=RelayModern&fb_api_req_friendly_name=PolarisProfilePageContentQuery&variables=%7B%22enable_integrity_filters%22%3Atrue%2C%22id%22%3A%221597623462%22%2C%22render_surface%22%3A%22PROFILE%22%2C%22__relay_internal__pv__PolarisProjectCannesEnabledrelayprovider%22%3Afalse%2C%22__relay_internal__pv__PolarisProjectCannesLoggedInEnabledrelayprovider%22%3Afalse%2C%22__relay_internal__pv__PolarisProjectCannesLoggedOutEnabledrelayprovider%22%3Afalse%2C%22__relay_internal__pv__PolarisCannesGuardianExperienceEnabledrelayprovider%22%3Afalse%2C%22__relay_internal__pv__PolarisCASB976ProfileEnabledrelayprovider%22%3Afalse%7D&server_timestamps=true&doc_id=24621196980843703",
  "method": "POST"
});


//stories
fetch("https://www.instagram.com/graphql/query", {
  "headers": {
    "accept": "*/*",
    "accept-language": "en-US,en;q=0.9",
    "content-type": "application/x-www-form-urlencoded",
    "priority": "u=1, i",
    "sec-ch-prefers-color-scheme": "dark",
    "sec-ch-ua": "\"Not;A=Brand\";v=\"99\", \"Google Chrome\";v=\"139\", \"Chromium\";v=\"139\"",
    "sec-ch-ua-full-version-list": "\"Not;A=Brand\";v=\"99.0.0.0\", \"Google Chrome\";v=\"139.0.7258.155\", \"Chromium\";v=\"139.0.7258.155\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-model": "\"\"",
    "sec-ch-ua-platform": "\"macOS\"",
    "sec-ch-ua-platform-version": "\"13.7.6\"",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    "x-asbd-id": "359341",
    "x-bloks-version-id": "64f02abc184fb0d9135db12e85e451a3be71c64f7231c320a09e7df0ef1bdf6d",
    "x-csrftoken": "nyxuHUOb6A4ZmAzuZANh2GTN5bGxmI6G",
    "x-fb-friendly-name": "PolarisStoriesV3ReelPageStandaloneQuery",
    "x-fb-lsd": "V0FmMBQi8bT6hKnQlKO3__",
    "x-ig-app-id": "936619743392459",
    "x-root-field-name": "xdt_api__v1__feed__reels_media",
    "cookie": "datr=gg_IaFJwm_qfFBo0llxwIemZ; ig_did=E17C528C-F6BD-464F-BA5E-BEE6C21B509C; mid=aMgPggAEAAGQczMZmteuxZq5eu8S; ps_l=1; ps_n=1; csrftoken=nyxuHUOb6A4ZmAzuZANh2GTN5bGxmI6G; ds_user_id=76948878513; sessionid=76948878513%3AYL3GuMjiR2dLeG%3A0%3AAYhMAxIzCrRZngVihE-b2CSrE4maKO27bTF7kF_iKQ; wd=1294x719; rur=\"RVA\\05476948878513\\0541789477953:01fe81d1f78c432c18f91ceffd17aac4cc0fe8fb396081d49bcc82a0514be5f67030841d\"",
    "Referer": "https://www.instagram.com/ft360_ir/"
  },
  "body": "av=17841476995408609&__d=www&__user=0&__a=1&__req=1t&__hs=20346.HYP%3Ainstagram_web_pkg.2.1...0&dpr=2&__ccg=MODERATE&__rev=1027114106&__s=laukyu%3A2mdyw6%3A3pjrlc&__hsi=7550302239217904971&__dyn=7xeUjG1mxu1syUbFp41twWwIxu13wvoKewSAwHwNw9G2S7o2vwa24o0B-q1ew6ywaq0yE462mcw5Mx62G5UswoEcE7O2l0Fwqo31w9a9wtUd8-U2zxe2GewGw9a361qwuEjUlwhEe87q0oa2-azqwt8d-2u2J0bS1LwTwKG1pg2fwxyo6O1FwlA3a3zhA6bwIxeUnAwCAxW1oxe6UaU6W1tyVrx60gm5osxWawOwgV84qdxq&__csr=ghg8Q4BPSOYgGkOaxthp59kvcASytA8lbQnFpoNHKiEHCjAiZkL-CHZczhduiADKnFykq9JuLF5yaAFJ2GG9K8AXjKfVpEyqi8QnKu8G8DBBGdgyl2u8B-6fHx3jGGx9ACgGcJoK9glxy4BKaHyGG9Bxyp2umeyK74FaUyUyaCyoHxi4LzpV94aymUgw05svx21Ayu8U0hlg0Vi0QoCbDwdQPxwM1gk0cFwro0Ce3G3OsE0TsMKFV-1QwAxe1zyoK8zVUzgrw8mm3Ijg84bDy9m1B82-fg1CJw9S2C22Owp8Cbw4mwdR90eAwbE6l0RAm0enw93wtUyU07NS04vE27w17e054o&__hsdp=gmgB15lsl4NkTbE8jvGhq6Swj93bDJF9tAHjEc5yNhDaaVyVbz7KzKAgUoUqx-dAhB5PwygLIuSl348K95aex1CEwGyAOL2sgNwNxmO7gd8gx4w9C56449XwgUC3iawk9A2EVUqx-eDwDwno6idx-2K0QU-E9oSm5K0WU27wtE760qOu0qd0n80w61qwiUuwi8kwc6dwbiE5m0IU32w9i1ww4i81igb8hw5GwaW1cAAbo4O0g21Gwl8f8&__hblp=0RCwNz8fErxa4opx17horh45ogixnxy5E67xK11wUzUKhu6UiBzo4OGyO2E9QdHUWfKubz_wzDzFo8UggB2pqxmtpUbbxu10x6iUvzFUsABBwBWAzojBGm3K7US3-by8661yxmE9pBKm4U3MDwmk2i1uxu1Nxe5F87y0-VVUkwrE17Q3S7Eao8E1A88U5G1bCxubwYxibw_wq8OdwYwVwVwn82Bzoswam0B8467E14y0jp42N3qg6-0YVoaEpwjUpBg4migiEaovwr84y1aG4o5m3S5EKfwww&__sjsp=gmgB15lshEh5jsKwxd-F5Erq1cAcKuSABSiJewM4hhCy2Kq-iUNVUyEK68sx-dBCkm3CNXpoR2byhizEgpG8aEFcHMD4co2G3W48eS0b3wf-1zU&__comet_req=7&fb_dtsg=NAfvJ9KgXDjF5BNtJ1Jr5Yp6Fbu6mvoaX4vf9D6uk3mF2uBLMg7zRyQ%3A17865145036029998%3A1757941722&jazoest=26193&lsd=V0FmMBQi8bT6hKnQlKO3__&__spin_r=1027114106&__spin_b=trunk&__spin_t=1757941730&__crn=comet.igweb.PolarisProfilePostsTabRoute&fb_api_caller_class=RelayModern&fb_api_req_friendly_name=PolarisStoriesV3ReelPageStandaloneQuery&variables=%7B%22reel_ids_arr%22%3A%5B%221597623462%22%5D%7D&server_timestamps=true&doc_id=24030498283300634",
  "method": "POST"
});



fetch("https://www.instagram.com/api/v1/users/web_profile_info/?username=haaaches", {
  "headers": {
    "accept": "*/*",
    "accept-language": "en-US,en;q=0.9",
    "priority": "u=1, i",
    "sec-ch-prefers-color-scheme": "dark",
    "sec-ch-ua": "\"Not;A=Brand\";v=\"99\", \"Google Chrome\";v=\"139\", \"Chromium\";v=\"139\"",
    "sec-ch-ua-full-version-list": "\"Not;A=Brand\";v=\"99.0.0.0\", \"Google Chrome\";v=\"139.0.7258.155\", \"Chromium\";v=\"139.0.7258.155\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-model": "\"\"",
    "sec-ch-ua-platform": "\"macOS\"",
    "sec-ch-ua-platform-version": "\"13.7.6\"",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    "x-asbd-id": "359341",
    "x-csrftoken": "xotEJl87Ij2O1UXcR4U248",
    "x-ig-app-id": "936619743392459",
    "x-ig-www-claim": "0",
    "x-mid": "1jcxbag1p4i4it1nvht971tluh0l139nuzn19wqg1d1dteu3e1thg1w2",
    "x-requested-with": "XMLHttpRequest",
    "x-web-device-id": "C64035C8-A98B-427C-A847-55B51FFF0EF3",
    "x-web-session-id": "vocxxe:42l7ll:oz5hsw",
    "cookie": "csrftoken=xotEJl87Ij2O1UXcR4U248; datr=HyrIaAVM3koDct2yieeRuidF; ig_did=C64035C8-A98B-427C-A847-55B51FFF0EF3; ps_l=1; ps_n=1",
    "Referer": "https://www.instagram.com/haaaches/"
  },
  "body": null,
  "method": "GET"
});
