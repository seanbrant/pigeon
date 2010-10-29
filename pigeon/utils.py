try:
    from django.utils import simplejson
except ImportError:
    import simplejson

json_dumps = simplejson.dumps
json_loads = simplejson.loads
