.PHONY: always all

all: txt/res.tsv

txt/datastring.json: always
	psql $(shell heroku config:get DATABASE_URL)  -AtF'	' -c "select datastring  from cardturk" | mkifdiff $@

txt/res.tsv: txt/datastring.json readraw.R datastring2tsv
	./datastring2tsv $< > $@
