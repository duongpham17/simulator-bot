const development = process.env.NODE_ENV === "development";
const website_link = development ? process.env.DEVELOPMENT_FRONTEND_URL : process.env.PRODUCTION_FRONTEND_URL;
const website_name = process.env.WEBSITE_NAME;
 
export const authTemplate = (des:string, url: string, code: string) => `
<html>
    <body>
        <table style="width: 100%;border-spacing: 0px;background: white;">
                
            <tr>
                <th style="text-align: center;padding: 0.5rem;font-size: 1.4rem">            
                    <h2>
                        <a href="${website_link}" style="text-decoration: none;color: black">${website_name}</a>
                    </h2>
                </th>
            </tr>
            <tr class="message">
                <td style="text-align: center">
                    Your magic link
                </td>
            </tr>
            <tr class="link">
                <td style="text-align: center">
                    <a class="link" href="${website_link}/${url}" style="text-decoration: none; color: black; border:2px solid grey; box-shadow:0 1px 10px -3px lightgrey; padding: 1rem 3rem; border-radius: 10px; display:block; width: 100px; margin: 1rem auto"> 
                        <b style="font-size: 1.2rem">${des}</b>
                    </a>
                <p style="margin-top: 4rem; display:block">
                    Your code
                </p>
                <p style="margin-top: 1rem">
                    <b style="font-size: 1.5rem">${code}</b>
                </p>
                
                </td>
            </tr>
            <tr>
            <td style="text-align: center; height: 100px">
                    If you did not request this email, please delete or ignore. 
            </td>
        </tr>
            <tr>
                <td style="height: 50px;">
                    <footer style="margin-top: 5rem; text-align: center; padding: 0.5rem; border-top: 1px solid black">
                    &#169; Meusic, 2022. <br> Please do not reply to this email. 
                    </footer>
                </td>
            </tr>
        </table>
    </body>
</html>
`

export const requestEmailChangeTemplate = (code: string) => `
<html>
    <body>
        <table style="width: 100%;border-spacing: 0px;background: white;">
                
            <tr>
                <th style="text-align: center;padding: 0.5rem;font-size: 1.4rem">            
                    <h2>
                        <a href="${website_link}" style="text-decoration: none;color: black">${website_name}</a>
                    </h2>
                </th>
            </tr>
            <tr class="link">
                <td style="text-align: center">
                    <p style="margin-top: 2rem; display:block">
                        Your code
                    </p>
                    <p style="margin-top: 1rem">
                        <b style="font-size: 1.5rem">${code}</b>
                    </p>
                </td>
            </tr>
            <tr>
            <td style="text-align: center; height: 100px">
                    If you did not request this email, please delete or ignore. 
            </td>
        </tr>
            <tr>
                <td style="height: 50px;">
                    <footer style="margin-top: 5rem; text-align: center; padding: 0.5rem; border-top: 1px solid black">
                    &#169; Meusic, 2022. <br> Please do not reply to this email. 
                    </footer>
                </td>
            </tr>
        </table>
    </body>
</html>
`