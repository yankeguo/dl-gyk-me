export default {
	async fetch(request, env, ctx): Promise<Response> {
		const url = new URL(request.url);
		const path = url.pathname;

		// 路径格式: /example.com/path/to/file
		// 提取域名和剩余路径
		const match = path.match(/^\/([^\/]+)(\/.*)?$/);
		if (!match) {
			return new Response('Invalid path. Use format: /domain.com/path/to/file', {
				status: 400,
			});
		}

		const targetHost = match[1];
		const targetPath = match[2] || '/';

		// 验证域名格式（简单检查）
		if (!targetHost.includes('.')) {
			return new Response('Invalid domain format', { status: 400 });
		}

		// 解析 __sr 参数，格式: __sr=old:new
		const replaceParams = url.searchParams.getAll('__sr');
		const replacements: Array<{ old: string; new: string }> = [];
		for (const param of replaceParams) {
			const colonIndex = param.indexOf(':');
			if (colonIndex > 0) {
				replacements.push({
					old: param.substring(0, colonIndex),
					new: param.substring(colonIndex + 1),
				});
			}
		}

		// 构建目标 URL 的查询参数，移除 __sr 参数
		const targetSearchParams = new URLSearchParams(url.searchParams);
		targetSearchParams.delete('__sr');
		const targetSearch = targetSearchParams.toString() ? `?${targetSearchParams.toString()}` : '';

		// 构建目标 URL
		const targetUrl = `https://${targetHost}${targetPath}${targetSearch}`;

		// 构建转发请求的 headers，移除一些不应该转发的 headers
		const headers = new Headers(request.headers);
		headers.delete('host');
		headers.delete('cf-connecting-ip');
		headers.delete('cf-ipcountry');
		headers.delete('cf-ray');
		headers.delete('cf-visitor');
		headers.delete('x-forwarded-proto');
		headers.delete('x-real-ip');

		// 转发请求
		const response = await fetch(targetUrl, {
			method: request.method,
			headers,
			body: request.body,
			redirect: 'follow',
		});

		// 返回响应，移除一些安全相关的响应头
		const responseHeaders = new Headers(response.headers);
		responseHeaders.delete('content-security-policy');
		responseHeaders.delete('x-frame-options');

		// 添加安全头，防止浏览器直接渲染页面
		// 强制作为附件下载
		const filename = targetPath.split('/').pop() || 'download';
		responseHeaders.set('Content-Disposition', `attachment; filename="${filename}"`);
		// 防止 MIME 类型嗅探
		responseHeaders.set('X-Content-Type-Options', 'nosniff');
		// 覆盖 Content-Type 为二进制流，防止浏览器识别为 HTML
		responseHeaders.set('Content-Type', 'application/octet-stream');

		// 如果有文本替换需求，读取响应体并进行替换
		let responseBody: BodyInit | null = response.body;
		if (replacements.length > 0) {
			let text = await response.text();
			for (const replacement of replacements) {
				text = text.replaceAll(replacement.old, replacement.new);
			}
			responseBody = text;
			// 更新 Content-Length
			responseHeaders.set('Content-Length', new TextEncoder().encode(text).length.toString());
		}

		return new Response(responseBody, {
			status: response.status,
			statusText: response.statusText,
			headers: responseHeaders,
		});
	},
} satisfies ExportedHandler<Env>;
