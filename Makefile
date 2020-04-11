.PHONY: test

TAP=$(shell which tap|| echo /usr/bin/tap)

test: ${TAP}
	node t/cards.js

${TAP}: 
	npm install tap -g

